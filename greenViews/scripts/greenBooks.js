import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import { doc, setDoc, connectFirestoreEmulator, collection, addDoc , getFirestore,getDoc, getDocs, query, orderBy, startAt, startAfter, limit, where} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC9cxAdUPzgjbqvcJ5gMWpB1trMci4WIm8",
    authDomain: "green-books-app.firebaseapp.com",
    projectId: "green-books-app",
    storageBucket: "green-books-app.firebasestorage.app",
    messagingSenderId: "153412264348",
    appId: "1:153412264348:web:c4cb56c38cbcad59a16859",
    measurementId: "G-B0XMGHPWYW"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app);


if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFunctionsEmulator(functions, "localhost", 5001);
    // If you use Firestore, connect that too!
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log("Connected to Auth and Functions Emulators");
}



let logInBtn = document.getElementById("logInBtn")
let joinBtn = document.getElementById("joinBtn")

let myModal = document.getElementById("myModal")
let emailET = document.getElementById("emailET")
let passwordET = document.getElementById("passwordET")
let signInBtn = document.getElementById("signInBtn")
let cancelBtn = document.getElementById("cancelBtn")

let resetModal = document.getElementById("resetModal")
let forgotBtn = document.getElementById("forgotBtn")
let resetEmailET = document.getElementById("resetEmailET")
let resetCancelBtn = document.getElementById("resetCancelBtn")
let resetSendBtn = document.getElementById("resetSendBtn")

let registerModal = document.getElementById("registerModal")
let registerNameET = document.getElementById("registerNameET")
let registerEmailET = document.getElementById("registerEmailET")
let registerPasswordET = document.getElementById("registerPasswordET")
let registerCancelBtn = document.getElementById("registerCancelBtn")
let registerRegisterBtn = document.getElementById("registerRegisterBtn")
;

logInBtn.onclick = () => {
    myModal.style.display = 'inline'
    //openMainView()
}

joinBtn.onclick = () => {
    //registerModal.style.display = 'inline'
    openRegisterView()
}

cancelBtn.onclick = () => {
    myModal.style.display = 'none'
}

signInBtn.onclick = () => {
    let email = emailET.value 
    let password = passwordET.value
    logIn(email, password)
}


forgotBtn.onclick = () => {
    myModal.style.display = 'none'
    resetModal.style.display = 'inline'
}

resetSendBtn.onclick = () => {
    
    let email = resetEmailET.value
    requestEmail(email)
}

resetCancelBtn.onclick = () => {
    resetModal.style.display = 'none'
}

registerCancelBtn.onclick = () => {
    registerModal.style.display = 'none'
}

registerRegisterBtn.onclick = () => {
    
    let name = registerNameET.value 
    let email = registerEmailET.value 
    let password = registerPasswordET.value 

    if(name == null || name.length < 3){
        alert('please enter a valid name')
        return 
    }

    if(email == null || email.length < 10){
        alert('please enter a valid email')
        return 
    }

    if(password == null || password.length < 9){
        alert('please enter a valid password')
        return 
    }

    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // User created
        const user = userCredential.user;
        console.log("User created:", user.uid);
        registerModal.style.display = "none"
        //now gotta open the app with the UID
        addUserToDatabase(user.uid, name, email)
        
    })
    .catch((error) => {
        console.error("Error creating user:", error);
    });
    

}

function openMainView()
{
    window.location.replace("greenViews/mainView.html");
}

function openRegisterView(){
    window.location.replace("greenViews/registerView.html");
}   

function logIn(email, password)
{
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        myModal.style.display = 'none'
        localStorage.setItem('userUID', user.uid);
        localStorage.setItem('userEmail', user.email);
        alert('welcome back')
        openMainView()
    })
    .catch((error) => {
        const errorode = error.code 
        const errorMessage = error.message
        alert(`there was an error ${errorMessage}`)
    })

}

function requestEmail(email)
{
    sendPasswordResetEmail(auth, email)
    .then(() => {
        // Password reset email sent!
        // ..
        alert('check your email to reset your password!')
        resetModal.style.display = 'none'
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert(`there was an error ${error}`)
        // ..
    })
}


/*async function addUserToDatabase(currentUser, name, email)
{
    try {
        await setDoc(doc(db, `users/${currentUser}`),
            {
                name: name,
                email: email
            }
        );
        openMainView()
    } 
    catch (error) {
        console.error("Error adding friend:", error);
        alert(`error:WF-395 ${error}`)
    }
}*/

async function addUserToDatabase(currentUser, name, email){

}