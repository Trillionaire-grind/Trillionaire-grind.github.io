import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import { doc, setDoc, serverTimestamp,collection, addDoc, updateDoc , getFirestore,getDoc, getDocs, query, orderBy, startAt, startAfter, limit, where, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBtOJ476HXPPTqhs7GFhCrRBbBlHO3n5Pk",
    authDomain: "mvp-greenbooks.firebaseapp.com",
    projectId: "mvp-greenbooks",
    storageBucket: "mvp-greenbooks.firebasestorage.app",
    messagingSenderId: "855438667917",
    appId: "1:855438667917:web:63646f84aa4fd5c82a72c4",
    measurementId: "G-WH3NHEGR92"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app)
const db = getFirestore(app)

const studentNameTV = document.getElementById("studentNameTV")

const links = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('main section');

const listBookModal = document.getElementById("listBookModal")

const scheduleViewer = document.getElementById("scheduleViewer")
const findBookBtn = document.getElementById("findBookBtn")
const fab = document.getElementById("fab")

const cancelListBtn = document.getElementById("cancelListBtn")
const sellListBtn = document.getElementById("sellListBtn")
const scheduleBtn = document.getElementById("scheduleBtn")

const scheduleModal = document.getElementById("scheduleModal")
const scheduleDiv = document.getElementById("scheduleDiv")
const addCourseModal = document.getElementById("addCourseModal")
const addCourseBtn = document.getElementById("addCourseBtn")
const addCancelBtn = document.getElementById("addCancelBtn")

const addCourseET = document.getElementById("addCourseET")

const scheduleCancelBtn = document.getElementById("scheduleCancelBtn")
const scheduleUpdateBtn = document.getElementById("scheduleUpdateBtn")

const addAddBtn = document.getElementById("addAddBtn")

const homeSection = document.getElementById('home');
const transactionsDiv = document.getElementById("transactionsDiv")
homeSection.classList.add('active');

const courseET = document.getElementById("courseET")

let studentSchool = ""
let studentName = ""
let studentSchedule = []
let studentTransactions = []


links.forEach(link => {
    link.addEventListener('click', (e) => {
    e.preventDefault();

    // Remove active styles
    links.forEach(l => l.classList.remove('active-link'));
    sections.forEach(s => s.classList.remove('active'));

    // Add active to clicked link
    link.classList.add('active-link');

    // Show corresponding section
    const targetId = link.getAttribute('href').substring(1); // removes the #
    const targetSection = document.getElementById(targetId);

    if (targetId == "transactions") {
        document.getElementById("mainFrame").style.backgroundColor = "#39B053"
    } else {
        document.getElementById("mainFrame").style.backgroundColor = '#fff'
    }
    if (targetSection) targetSection.classList.add('active');
    });
});

fab.onclick = () => {
    showListBookModal()
}

sellListBtn.onclick = () => {
    uploadBook()     
}


addCancelBtn.onclick = () => {
    addCourseModal.style.display = 'none'
}

addAddBtn.onclick = () => {
    let courseName = addCourseET.value
    addToScheduleDiv(courseName)
    addCourseModal.style.display = 'none'
    addCourseET.value = ''
}

scheduleBtn.onclick = () => {
    showScheduleModal()
}

addCourseBtn.onclick = () => {
    addCourseModal.style.display = 'flex'
}

scheduleCancelBtn.onclick = () => {
    resetSchedule()
    scheduleModal.style.display = 'none'
}

scheduleUpdateBtn.onclick = () => {
    getSchedule()
}

signOutBtn.onclick = () => {
    signOut(auth).then(() => {
    // Sign-out successful.
    openSalesPage();
    }).catch((error) => {
    // An error happened.
    alert(`erorr ${error}`)
    });
}

cancelListBtn.onclick = () => {
    
    listBookModal.style.display = 'none'
}

function openRegisterView() {
    window.location.replace("registerView.html");
}

function openSalesPage(){
    window.location.replace("../greenBooks.html")
}

function showListBookModal() {
    listBookModal.style.display = 'flex'
}

function showScheduleModal(){
    scheduleModal.style.display = 'flex'
}

function toggleOptionalFields() {
    const optional = document.getElementById('optionalFields');
    const btn = document.getElementById('toggleOptionalBtn');
    if (optional.style.display === 'none' || optional.style.display === '') {
    optional.style.display = 'block';
    btn.textContent = 'Hide Optional Fields ▲';
    } else {
    optional.style.display = 'none';
    btn.textContent = 'Show Optional Fields ▼';
    }
}

function closeAddFriend() {
    document.getElementById('friendModal').style.display = 'none';
    document.getElementById('friendPic').value = ''; // reset file input

    // Reset optional fields hidden & toggle button text
    const optional = document.getElementById('optionalFields');
    optional.style.display = 'none';
    document.getElementById('toggleOptionalBtn').textContent = 'Show Optional Fields ▼';

    // Clear all fields
    document.getElementById('friendName').value = '';
    document.getElementById('friendFact').value = '';
    document.getElementById('friendEmail').value = '';
    document.getElementById('friendPhone').value = '';
    document.getElementById('friendGroup').value = '';
}


async function getStudentInfo(){
    // get the name and get 
    const studentId = auth.currentUser.uid;

    let  studentRef = doc(db, `Students/${studentId}`)

    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
    alert("error MV: 790")
    } else {
    let data = studentSnap.data()
    let name = data.name
    let courses =  data.courses
    studentSchool = data.school
    studentName = name
    studentSchedule = data.schedule
    populateData(name, courses)
    }
}

const MAX_LENGTH = 8;

courseET.addEventListener("input", (e) => {
  const el = e.target;

  let value = el.value;

  // Remove ALL whitespace
  value = value.replace(/\s+/g, "");

  // Force uppercase
  value = value.toUpperCase();

  // Enforce max length
  if (value.length > MAX_LENGTH) {
    value = value.slice(0, MAX_LENGTH);
  }

  el.value = value;
});



async function getTransactions()
{
    const studentId = auth.currentUser.uid 

    try{
    let transactionsRef = collection(db, `Students/${studentId}/transactions`)
    const transactionsSnap = await getDocs(transactionsRef)

    if(transactionsSnap.empty){
        noTransactions()
        return 
    }
    const transactions = transactionsSnap.docs.map(doc => ({
        id: doc.id, 
        ...doc.data()
    }))
    
    studentTransactions = transactions
    for(var i=0; i<transactions.length; i++){
        addTransactionDiv(transactions[i], transactions[i].id)
    }
    }catch (err){
    alert(`error MV-865 ${err}`)
    }
}

function populateData(name, courses){
    let studentNameTV = document.getElementById("studentNameTV")
    studentNameTV.innerHTML = name
    for(let i=0; i<courses.length; i++){
    addCourseDiv(courses[i])
    addToScheduleDiv(courses[i])
    }
}

function getSchedule(){
    const courses = [...scheduleDiv.querySelectorAll(".course-name")]
        .map(el => el.textContent.trim().toUpperCase());
    updateSchedule(courses)
}

function resetSchedule()
{
    if(studentSchedule != null && studentSchedule.length > 0)
    {
    scheduleDiv.innerHTML = ""
    for(var i=0; i<studentSchedule.length; i++)
    {
        addToScheduleDiv(studentSchedule[i])
    }
    }
}

function addTransactionDiv(transaction){
    var status = ""
    if(transaction.status == "listed"){ status = "status-listed"}
    if(transaction.status == "listing_removed"){status = "status-removed"}
    if(transaction.status == "pending"){status = "status-pending"}
    if(transaction.status == "transaction_completed"){status = "status-completed"}
    if(transaction.status == "transaction_cancelled"){status = "status-cancelled"}
    let div = `
    <div class="transaction-card" data-course-id="${transaction.book.course}"  data-seller-id="${transaction.book.sellerId}" data-buyer-id="${transaction.buyerId}"  data-tx-id="${transaction.id}">
        <div class="tx-header">
        <h3 class="book-title">${transaction.book.title} - ${transaction.book.author}</h3>
        <span class="status-badge ${status}">${transaction.status}</span>
        </div>
        <p class="tx-id">ID: ${transaction.book.transactionId}</p>
        <div class="tx-row">
        <span><strong>Seller:</strong>${transaction.book.sellerName ?? ""}</span>
        <span><strong>Buyer:</strong> ${transaction.buyerName ?? ""}</span>
        </div>
        <div class="tx-row">
        <span><strong>Meeting:</strong> ${transaction.meetingTime ?? "-"}</span>
        </div>
        <div class="tx-row">
        ${renderButtons(transaction.status)}
        </div>
    </div>
    `
    transactionsDiv.insertAdjacentHTML("beforeend", div); //new one
}

function renderButtons(status) {
    if (status === "pending") {
    return `
        <button class="btn-cancel" style="margin-right:8px;" data-action="cancel">Cancel Transaction</button>
        <button class="btn-primary" style="background-color: #000; margin-left: 8px" data-action="complete">Complete Transaction</button>
    `;
    }

    if (status === "listed") {
    return `
        <button class="btn-primary" data-action="remove">
        Remove Listing
        </button>
    `;
    }
    return "";
}

async function updateSchedule(courses){
    let userId = auth.currentUser.uid 

    try {
    await updateDoc(doc(db, `Students/${userId}`),
        {
            courses : courses
        }
    );
        
    scheduleModal.style.display = 'none'
    } catch (error) {
        console.error("Error adding friend:", error);
        alert(`error:WF-395 ${error}`)
    }
}

function addCourseDiv(course)
{
    const div = `
    <div class="courseCellDiv" style="width: 100%;">
        <p style="background-color: white; color: #328f43; font-size: 24px;">${course}</p>
        <button class="findBookBtn" style="background-color: black; color: white; margin-left: auto;">Find Book</button>
    </div>
    `
    document.getElementById("scheduleViewer").innerHTML += div
}

function addToScheduleDiv(courseName)
    { 
    let courseDiv = `
        <div style="display: flex; width: 80%; margin-left: auto; margin-right: auto"> 
        <p  class="course-name" style="width: 70%; background-color: white; color: #000; padding: 8px;"> ${courseName.toUpperCase()}</p>
        <p  onclick="this.parentElement.remove()" style="width: 30%; color: white; text-align:center; font-size: 24px; cursor: pointer"> X </p>
        </div>
    `
    scheduleDiv.innerHTML += courseDiv
    }

function getBookInfo()
{
    const course = document.getElementById("courseET").value
    const title = document.getElementById("titleET").value
    const author = document.getElementById("authorET").value
    const quality = document.getElementById("qualityET").value
    const price = Number(document.getElementById("priceET").value)
    let book = {
    course : course, 
    title : title, 
    author : author, 
    quality : quality, 
    sellerName : studentName, 
    timeChips : getAvailabilitySelections(),
    price : price,
    sellerId : auth.currentUser.uid
    }
    return book
}


async function uploadBook(){
    let book = getBookInfo()
    let transactionId = uuidv4()
    book.transactionId = transactionId
    try{
    const docRef = await addDoc(collection(db, `Schools/${studentSchool}/Courses/${book.course}/books`), book);
    listBookModal.style.display = 'none'
    alert(`book listed!`)
    
    createReceipt(book, docRef.id)
    }
    catch(err){
    alert(`there was an error ${err}`)
    }
}

async function createReceipt(book, bookId){
    let transaction = {
    book : book, 
    buyerId : null, 
    meetingTime : null, 
    status : "listed",
    bookId : bookId
    }

    try{
    let recRef = await setDoc(doc(db, `Students/${auth.currentUser.uid}/transactions/${book.transactionId}`), transaction)
    } catch (error){
    alert(`error MV-844 ${error}`)
    }
}

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

onAuthStateChanged(auth, user => {
    if (user) {
    getStudentInfo()
    listenForTransactions()

    } else {
    console.log("No user logged in");
    openRegisterView()
    }
});

scheduleViewer.addEventListener("click", e => {
if (e.target.classList.contains("findBookBtn")) {
    const courseName = e.target
    .closest(".courseCellDiv")
    .querySelector("p").textContent;
    openListedBooks( studentSchool, courseName)
    }
});

document.addEventListener("click", async (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;

    const card = button.closest(".transaction-card");
    if (!card) return;

    const txId = card.dataset.txId;
    const buyerId = card.dataset.buyerId
    const sellerId = card.dataset.sellerId
    const action = button.dataset.action;
    const courseId = card.dataset.courseId

    switch (action) {
    case "remove":
        await updateTransaction(sellerId,txId, "listing_removed");
        alert('listing removed')
        deleteBookByTransactionId(studentSchool, courseId, txId)
        break;

    case "cancel":
        await updateTransaction(buyerId, txId, "transaction_cancelled");
        await updateTransaction(sellerId, txId, "transaction_cancelled");
        alert('transaction cancelled')

        break;

    case "complete":
        await updateTransaction(buyerId,txId, "transaction_completed");
        await updateTransaction(sellerId,txId, "transaction_completed");
        alert('transaction completed')
        break;
    }
});

async function deleteBookByTransactionId(schoolId, courseId, transactionId) {
    try {
    const booksRef = collection(
        db,
        `Schools/${schoolId}/Courses/${courseId}/books`
    );
    const q = query(
        booksRef,
        where("transactionId", "==", transactionId)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
        alert("No book found for this transaction.");
        return;
    }

    // In case there is more than one (usually should be one)
    const deletePromises = snap.docs.map(bookDoc =>
        deleteDoc(bookDoc.ref)
    );

    await Promise.all(deletePromises);


    } catch (error) {
    console.error("Error deleting book:", error);
    alert("error MV-1220");
    }
}

async function removeFromListing(schoolId,courseId ,id){
    try{            
        await deleteDoc(doc(db, `Schools/${schoolId}/Courses/${courseId}/books`, id));
    }catch(error){
        alert(`error LB-639: ${error}`)
    }
}   


async function removeListing(txId) {
    await updateDoc(
    doc(db, `Students/${auth.currentUser.uid}/transactions/${txId}`),
    { status: "listing_removed" }
    );
}
async function updateTransaction(userId, transactionId, status) {
    await updateDoc(
    doc(db, `Students/${userId}/transactions/${transactionId}`),
    { status: `${status}` }
    );
}


async function cancelTransaction(txId) {
    await updateDoc(
    doc(db, `Students/${auth.currentUser.uid}/transactions/${txId}`),
    { status: "transaction_cancelled" }
    );
}

async function completeTransaction(txId) {
    await updateDoc(
    doc(db, `Students/${auth.currentUser.uid}/transactions/${txId}`),
    {
        status: "transaction_completed",
        completedAt: serverTimestamp()
    }
    );
}

function updateStatus(card, newStatus) {
    const badge = card.querySelector(".status-badge");
    badge.textContent = newStatus;
    badge.className = `status-badge status-${newStatus}`;
}

function openListedBooks(school, course){
    window.open(`listedBooks.html?id=${school}&course=${course}`, '_blank').focus();
}

document.addEventListener("DOMContentLoaded", () => {
    const availabilityDiv = document.getElementById("availabilityDiv");
    availabilityDiv.addEventListener("click", (e) => {
    if (e.target.classList.contains("tag")) {
        e.target.classList.toggle("selected");
        
    }
    });
});

function getAvailabilitySelections() {
    const results = [];

    // Loop each row (day block)
    document.querySelectorAll("#availabilityDiv > div").forEach(row => {
    const day = row.querySelector("p").textContent.trim();
    row.querySelectorAll(".tag.selected").forEach(tag => {
        results.push(`${day} ${tag.textContent.trim()}`)
    })
    });

    return results;
}

function noTransactions(){
    transactionsDiv.innerHTML = `
    <p style="width: 100%; text-align: center; color: white"> No Transactions yet... </p>
    `
}

let unsubscribeTransactions = null;


function listenForTransactions() {

    const studentRef = doc(db, `Students/${auth.currentUser.uid}`);
    // First: check if user exists (ONE TIME)
    getDoc(studentRef).then(transactionsSnap => {
        if (!transactionsSnap.exists()) {
        transactionsDiv.innerHTML = `
            <p style="width: 100%; text-align:center">
            No transactions yet...
            </p>
        `;
        return;
        }

        const transactionsCol = collection(studentRef, "transactions");

        // 🔥 REALTIME LISTENER
        unsubscribeTransactions = onSnapshot(
        transactionsCol,
        (snapshot) => {
        transactionsDiv.innerHTML = ""; // clear UI first

            if (snapshot.empty) {
            transactionsDiv.innerHTML = `
                <p style="width: 100%; text-align:center; color:white">
                No transactions yet...
                </p>
            `;
            return;
            }

            studentTransactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
            }));
            

            studentTransactions.forEach((transaction, index) => {
            try {
            addTransactionDiv(transaction, index);
            } catch (err) {
                alert("addBookDiv crashed for book:");
            }
            });
        },
        (error) => {
            console.error("Books listener error:", error);
            alert("error MV-1340");
        }
        );
    });
}

function updateTransactionCard(txId, data) {
    const card = document.querySelector(
    `.transaction-card[data-tx-id="${txId}"]`
    );

    if (!card) return;

    // Update status badge
    const badge = card.querySelector(".status-badge");
    badge.textContent = data.status;
    badge.className = `status-badge status-${data.status}`;

    // Update buttons
    const buttonRow = card.querySelector(".tx-row");
    buttonRow.innerHTML = renderButtons(data.status);
}

function removeTransactionCard(txId) {
    const card = document.querySelector(
    `.transaction-card[data-tx-id="${txId}"]`
    );

    if (card) {
    card.remove();
    }
}