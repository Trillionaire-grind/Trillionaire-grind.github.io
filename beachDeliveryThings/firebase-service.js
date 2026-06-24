/**
 * Beach Delivery — Firebase Auth + Firestore service layer.
 * Exposes window.BDFirebase. Falls back gracefully when firebase-config.js is not set up.
 */
(function () {
  const PLACEHOLDER = "YOUR_API_KEY";
  let configured = false;
  let db = null;
  let ordersUnsubscribe = null;
  let adminOrdersUnsubscribe = null;

  function isConfigured() {
    return configured;
  }

  function isPlaceholderConfig() {
    const config = window.FIREBASE_CONFIG || window.firebaseConfig;
    return !config
      || !config.apiKey
      || config.apiKey === PLACEHOLDER;
  }

  function toIso(value) {
    if (!value) return new Date().toISOString();
    if (typeof value === "string") return value;
    if (value.toDate) return value.toDate().toISOString();
    return new Date(value).toISOString();
  }

  function docToOrder(doc) {
    const data = doc.data();
    return {
      id: doc.id,
      number: data.number,
      customerUid: data.customerUid,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
      status: data.status,
      etaMinutes: data.etaMinutes,
      customer: data.customer || {},
      dropoff: data.dropoff || {},
      deliveryNotes: data.deliveryNotes || "",
      paymentMethod: data.paymentMethod || "",
      items: data.items || [],
      subtotal: data.subtotal,
      deliveryFee: data.deliveryFee,
      total: data.total,
    };
  }

  function stopOrdersListeners() {
    if (ordersUnsubscribe) { ordersUnsubscribe(); ordersUnsubscribe = null; }
    if (adminOrdersUnsubscribe) { adminOrdersUnsubscribe(); adminOrdersUnsubscribe = null; }
  }

  async function initStaffConfig() {
    if (!db) return;
    const ref = db.collection("config").doc("staff");
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        emails: window.STAFF_EMAILS || [],
        uids: [],
      });
    }
  }

  async function init() {
    if (typeof firebase === "undefined") {
      console.warn("[BDFirebase] Firebase SDK not loaded — using local storage fallback.");
      return false;
    }
    if (isPlaceholderConfig()) {
      console.warn("[BDFirebase] firebase-config.js not configured — using local storage fallback.");
      return false;
    }

    try {
      const config = window.FIREBASE_CONFIG || window.firebaseConfig;
      firebase.initializeApp(config);
      db = firebase.firestore();
      configured = true;
      await initStaffConfig();
      return true;
    } catch (err) {
      console.error("[BDFirebase] init failed:", err);
      configured = false;
      return false;
    }
  }

  function onAuthChange(callback) {
    if (!configured) return () => {};
    return firebase.auth().onAuthStateChanged(async (fbUser) => {
      if (!fbUser) {
        stopOrdersListeners();
        callback(null, null);
        return;
      }
      let profile = null;
      try {
        const snap = await db.collection("users").doc(fbUser.uid).get();
        profile = snap.exists ? snap.data() : null;
      } catch (err) {
        console.error("[BDFirebase] profile load failed:", err);
      }
      callback(fbUser, profile);
    });
  }

  async function signUp(email, password, profile) {
    if (!configured) throw new Error("Firebase not configured");
    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: profile.name });
    await db.collection("users").doc(cred.user.uid).set({
      name: profile.name,
      email,
      phone: profile.phone || "",
      preferredDropoffId: profile.preferredDropoffId || "18th-ave-s",
      theme: profile.theme || "classic",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return cred.user;
  }

  async function signIn(email, password) {
    if (!configured) throw new Error("Firebase not configured");
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    return cred.user;
  }

  async function signOut() {
    if (!configured) return;
    stopOrdersListeners();
    await firebase.auth().signOut();
  }

  async function saveUserProfile(uid, patch) {
    if (!configured || !uid) return;
    await db.collection("users").doc(uid).set(patch, { merge: true });
  }

  async function isStaffUser(fbUser) {
    if (!configured || !fbUser) return false;
    const allowlist = window.STAFF_EMAILS || [];
    if (allowlist.includes(fbUser.email)) return true;
    try {
      const snap = await db.collection("config").doc("staff").get();
      if (!snap.exists) return false;
      const data = snap.data();
      return (data.emails || []).includes(fbUser.email)
        || (data.uids || []).includes(fbUser.uid);
    } catch (_) {
      return false;
    }
  }

  async function fetchMyOrders(uid) {
    if (!configured || !uid) return [];
    const snap = await db.collection("orders")
      .where("customerUid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return snap.docs.map(docToOrder);
  }

  async function fetchAllOrders() {
    if (!configured) return [];
    const snap = await db.collection("orders")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    return snap.docs.map(docToOrder);
  }

  function subscribeMyOrders(uid, onUpdate, onError) {
    if (!configured || !uid) return () => {};
    if (ordersUnsubscribe) ordersUnsubscribe();
    ordersUnsubscribe = db.collection("orders")
      .where("customerUid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .onSnapshot(
        (snap) => onUpdate(snap.docs.map(docToOrder)),
        (err) => {
          console.error("[BDFirebase] my orders listener:", err);
          onError?.(err);
        }
      );
    return ordersUnsubscribe;
  }

  function subscribeAllOrders(onUpdate, onError) {
    if (!configured) return () => {};
    if (adminOrdersUnsubscribe) adminOrdersUnsubscribe();
    adminOrdersUnsubscribe = db.collection("orders")
      .orderBy("createdAt", "desc")
      .limit(100)
      .onSnapshot(
        (snap) => onUpdate(snap.docs.map(docToOrder)),
        (err) => {
          console.error("[BDFirebase] all orders listener:", err);
          onError?.(err);
        }
      );
    return adminOrdersUnsubscribe;
  }

  async function createOrder(orderData) {
    if (!configured) throw new Error("Firebase not configured");
    const fbUser = firebase.auth().currentUser;
    if (!fbUser) throw new Error("Must be signed in to place an order");

    const orderRef = db.collection("orders").doc();
    const counterRef = db.collection("counters").doc("orders");
    let number;

    await db.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef);
      number = (counterSnap.exists ? counterSnap.data().last : 1000) + 1;
      tx.set(counterRef, { last: number }, { merge: true });
      tx.set(orderRef, {
        number,
        customerUid: fbUser.uid,
        status: orderData.status || "received",
        etaMinutes: orderData.etaMinutes ?? 15,
        customer: orderData.customer,
        dropoff: orderData.dropoff,
        deliveryNotes: orderData.deliveryNotes || "",
        paymentMethod: orderData.paymentMethod,
        items: orderData.items,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        total: orderData.total,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });

    const now = new Date().toISOString();
    return {
      id: orderRef.id,
      number,
      customerUid: fbUser.uid,
      createdAt: now,
      updatedAt: now,
      status: orderData.status || "received",
      etaMinutes: orderData.etaMinutes ?? 15,
      customer: orderData.customer,
      dropoff: orderData.dropoff,
      deliveryNotes: orderData.deliveryNotes || "",
      paymentMethod: orderData.paymentMethod,
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total,
    };
  }

  async function updateOrder(orderId, patch) {
    if (!configured) throw new Error("Firebase not configured");
    const ref = db.collection("orders").doc(orderId);
    await ref.update({
      ...patch,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    const snap = await ref.get();
    return docToOrder(snap);
  }

  window.BDFirebase = {
    init,
    isConfigured,
    onAuthChange,
    signUp,
    signIn,
    signOut,
    saveUserProfile,
    isStaffUser,
    subscribeMyOrders,
    subscribeAllOrders,
    fetchMyOrders,
    fetchAllOrders,
    createOrder,
    updateOrder,
    stopOrdersListeners,
  };
})();
