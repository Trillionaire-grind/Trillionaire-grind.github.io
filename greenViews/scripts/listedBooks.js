import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getAuth,onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import { doc, setDoc, collection, addDoc , getFirestore,getDoc, getDocs, query, orderBy, startAt, startAfter, limit, where, deleteDoc, updateDoc, onSnapshot} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

const titleTV = document.getElementById("titleTV")
const booksDiv = document.getElementById("booksDiv")
const booksListDiv = document.getElementById("booksListDiv")

const confirmModal = document.getElementById("")

let allBooks = [];              // 🔑 global
let selectedBookIndex = null;
let selectedTime = null;

let studentName = null 

let unsubscribeBooks = null;

// First: check if course exists (ONE TIME)
function listenForBooks() {
    const params = new URLSearchParams(window.location.search);
    const schoolId = params.get("id");
    const courseId = params.get("course");

    titleTV.innerText = `Books For ${courseId}`;

    const courseRef = doc(db, `Schools/${schoolId}/Courses/${courseId}`);

    // First: check if course exists (ONE TIME)
    getDoc(courseRef).then(courseSnap => {
        if (!courseSnap.exists()) {
        booksDiv.innerHTML = `
            <p style="width: 100%; text-align:center">
            Course not added yet...
            </p>
        `;
        return;
        }

        const booksCol = collection(courseRef, "books");

        // 🔥 REALTIME LISTENER
        unsubscribeBooks = onSnapshot(
        booksCol,
        (snapshot) => {
            booksDiv.innerHTML = ""; // clear UI first

            if (snapshot.empty) {
            booksDiv.innerHTML = `
                <p style="width: 100%; text-align:center">
                No books available yet...
                </p>
            `;
            return;
            }

            const books = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
            }));

            allBooks = books;

            books.forEach((book, index) => {
                try {
                    addBookDiv(book, index);
                } catch (err) {
                    alert("error LB-542");
                }
            });
        },
        (error) => {
            console.error("Books listener error:", error);
            alert("error LB-548");
        }
        );
    });
}

async function getBooks() {
    const params = new URLSearchParams(window.location.search);
    const schoolId = params.get("id");
    const courseId = params.get("course")
    titleTV.innerText = `Books For ${courseId}`
    try {
        // 1) Check if the course exists first
        const courseRef = doc(db, `Schools/${schoolId}/Courses/${courseId}`);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            booksDiv.innerHTML += `
            <p style="width: 100%; text-align:center">
                Course not added yet...
            </p>
            `
            return [];
        }

        // 2) Read the books collection
        const booksCol = collection(courseRef, "books");
        const booksSnap = await getDocs(booksCol);

        if (booksSnap.empty) {
            booksDiv.innerHTML += `
            <p style="width: 100%; text-align:center">
                No books available yet...
            </p>
            `
            return [];
        }

        // 3) Convert docs → array of objects
        const books = booksSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        allBooks = books
        for(var i=0; i< books.length; i++){
            addBookDiv(books[i], i)
        }
        return books;

    } catch (err) {
        console.error("Error fetching books:", err);
        alert(`error LB-600`);
        return [];
    }
}
function addTimeTags(timeTags){
    let parentDiv = `
    <div>
        <p style="width: 100%; text-align: center; color: white; margin-top: 16px;">Availability</p>
        <div class="tags">
    `
    let tagsDiv = document.getElementById("tagsDiv")
    
    for(var i=0; i < timeTags.length; i++){
        
        let tag  = `<span class="tag">${timeTags[i]}</span>`
        parentDiv  += tag
    }
    parentDiv += `
        </div>
    </div>
    `            
    return parentDiv
}

function showNoBooks(){

}

function addBookDiv(book, index) {
    if (!book) return;

    let div = `
        <div class="book-card" data-index="${index}"  style="
        width: 80%;
        margin: 24px auto;
        background-color: #39B053;
        padding: 16px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        ">
        <p style="padding:16px;background:#fff;color:#000;width:90%;margin:auto; border-radius: 12px">
            ${book.title ?? "Untitled Book"}
        </p>

        <p style="padding:16px;background:#fff;color:#000;width:90%;margin:auto;border-radius: 12px">
            ${book.author ?? "Unknown Author"}
        </p>

        <div style="display:flex;">
            <p style="padding:16px;background:#fff;color:#000;width:40%;margin:auto; margin-right: 8px; border-radius: 12px">
            ${book.quality ?? "-"}
            </p>

            <p style="padding:16px;background:#fff;color:#000;width:40%;margin:auto; margin-left:8px;text-align:center;border-radius: 12px">
            ${book.price ?? "-"}
            </p>
        </div>

        ${addTimeTags(book.timeChips)}
        </div>
    `;
    booksDiv.insertAdjacentHTML("beforeend", div);
}

onAuthStateChanged(auth, user => {
    if (user) {
        //getBooks()
        listenForBooks()
    } else {
        console.log("No user logged in");
        // maybe redirect to login
        openRegisterView()
    }
});

document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("tag")) return;

    const card = e.target.closest(".book-card");
    if (!card) return;

    const bookIndex = card.dataset.index;
    const time = e.target.textContent.trim();

    selectedBookIndex = bookIndex;
    selectedTime = time;

    openConfirmModal();
});


function openRegisterView() {
    window.location.replace("registerView.html");
}

function openConfirmModal() {
    const book = allBooks[selectedBookIndex];
    var author = ""
    var seller = "" 
    if(book.author != null) { author = book.author}
    if(book.sellerName != null) { seller = book.sellerName}

    document.getElementById("modalBookTitle").textContent = book.title;
    document.getElementById("modalTime").textContent = selectedTime;
    document.getElementById("authorTV").textContent = author
    document.getElementById("sellerTV").textContent = seller
    document.getElementById("qualityTV").textContent = book.quality 
    document.getElementById("priceTV").textContent = `$${book.price}`
    document.getElementById("confirmModal").classList.remove("hidden");
}

document.getElementById("modalCancelBtn").onclick = () => {
    closeModal();
};

document.getElementById("modalConfirmBtn").onclick = () => {
    const params = new URLSearchParams(window.location.search);
    const schoolId = params.get("id");
    const courseId = params.get("course")

    removeFromListing(schoolId , courseId, allBooks[selectedBookIndex].id)
    let tempTransaction =  {
        book : allBooks[selectedBookIndex], 
        buyerId : `${auth.currentUser.uid}`, 
        buyerName : studentName,
        meetingTime : `${document.getElementById("modalTime").textContent}`, 
        status : `pending`, 
    }
    createBuyerTransaction(tempTransaction, allBooks[selectedBookIndex].transactionId )
}

async function removeFromListing(schoolId,courseId ,id){
    try{                
        await deleteDoc(doc(db, `Schools/${schoolId}/Courses/${courseId}/books`, id));
    }catch(error){
        alert(`error LB-639: ${error}`)
    }
}   

async function createBuyerTransaction(transaction, transactionId)
{
    try{
        await setDoc(doc(db,`Students/${auth.currentUser.uid}/transactions/${transactionId}`), transaction);
        updateTransaction( transaction, allBooks[selectedBookIndex].transactionId)
        closeModal()
    }catch(err){
        alert(`error LB-747s ${err}`)
    }
}

async function updateTransaction(transaction, transactionId) {
    try {
        await updateDoc(
        doc(db, `Students/${transaction.book.sellerId}/transactions/${transactionId}`), transaction)
        window.close()
        alert('meeting confirmed')
    } catch (err) {
        alert(`error LB-758`);
        console.error(err);
    }
}

function closeModal() {
    document.getElementById("confirmModal").classList.add("hidden");
    selectedBookIndex = null;
    selectedTime = null;
}


window.addEventListener("beforeunload", () => {
    if (unsubscribeBooks) {
        unsubscribeBooks();
    }
});

async function getStudentInfo(){
    const studentId = auth.currentUser.uid;

    let  studentRef = doc(db, `Students/${studentId}`)

    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
        alert("error MV: 790")
    } else {
        let data = studentSnap.data()
        let name = data.name
        let courses =  data.courses
        studentName = name
    }
}

onAuthStateChanged(auth, user => {
    if (user) {
        getStudentInfo()
    } else {
        openRegisterView()
    }
});