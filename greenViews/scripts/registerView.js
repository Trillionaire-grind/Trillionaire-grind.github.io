import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import { doc, setDoc, collection, addDoc , getFirestore,getDoc, getDocs, query, orderBy, startAt, startAfter, limit, where, updateDoc} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

const firstSectionDiv = document.getElementById("firstSectionDiv")
const nameET = document.getElementById("nameET")
const emailET = document.getElementById("emailET")
const passwordET = document.getElementById("passwordET")

const secondSectionDiv = document.getElementById("secondSectionDiv") 
const createLogInBtn = document.getElementById("createLogInBtn")
const addCourseBtn = document.getElementById("addCourseBtn")

const addCourseModal = document.getElementById("addCourseModal")
const courseET = document.getElementById("courseET")
const addSendBtn = document.getElementById("addSendBtn")
const addCancelBtn = document.getElementById("addCancelBtn")

const scheduleDiv = document.getElementById("scheduleDiv")

const saveScheduleBtn = document.getElementById("saveScheduleBtn")


addCourseBtn.onclick = () => {
    addCourseModal.style.display = 'inline'
}

saveScheduleBtn.onclick = () => {
    getSchedule()
}

addSendBtn.onclick = () => {
    const test = courseET.value 
    addCourseModal.style.display = "none"
    addCourseDiv(test)
    courseET.value = ''
}

addCancelBtn.onclick = () => {
    addCourseModal.style.display = "none"
    courseET.value = ''
}

createLogInBtn.onclick = () => {
    createLogIn()
}

function addCourseDiv(courseName){ 
    let courseDiv = `
        <div style="display: flex; width: 80%; margin-left: auto; margin-right: auto"> 
        <p  class="course-name" style="width: 70%; background-color: white; color: #000; padding: 8px;"> ${courseName.toUpperCase()}</p>
        <p  onclick="this.parentElement.remove()" style="width: 30%; color: white; text-align:center; font-size: 24px; cursor: pointer"> X </p>
        </div>
    `
    scheduleDiv.innerHTML += courseDiv
}

function createLogIn()
{
    if(nameET.value.length < 2){
        alert(`name is too short`)
        return 
    }
    else if(emailET.value.length < 12){
        alert('enter a valid school email')
        return 
    }
    else if(passwordET.value.length < 8){
        alert('please make sure that password is 8+ characters')
    }

    if(emailET.value.split('@').value == 0)
    {
        alert("enter a valid school email")
    }
    else
    {
        const schoolEmail = emailET.value.split('@')[1]
        //check if that school exists,
        checkSchoolByEmail(schoolEmail)
    }
}

async function checkSchoolByEmail(email){
    const q = query(
        collection(db, "Schools"), 
        where("email", "==", `${email}`)
    )

    const snapshot = await getDocs(q)

    if(!snapshot.empty){
        const doc = snapshot.docs[0]
        const data = doc.data()
        const school = data.schoolUid 
        registerUser(school)
    }else{
        alert("school is not added yet")
        //here they will be given the option of requesting their school to be added
    }
}

function registerUser(school){
    const name = nameET.value 
    const email = emailET.value 
    const password = passwordET.value
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // User created
            const user = userCredential.user;
            //now gotta open the app with the UID
            addUserToDatabase(user.uid, name, school)
        })
        .catch((error) => {
            console.error("Error creating user:", error);
    });
}

async function addUserToDatabase(userId, name, school){
    try {
        await setDoc(doc(db, `Students/${userId}`),
            {
                name: name,
                school: school,
                earlyBirdSpecial : false,
                courses : []
            }
        );
        openSecondView()
    } 
    catch (error) {
        console.error("Error adding friend:", error);
        alert(`error:WF-395 ${error}`)
    }
}

function openSecondView(){
    document.getElementById("sectionName").innerText = "Schedule"
    firstSectionDiv.style.display = "none"
    secondSectionDiv.style.display = "flex"
}

function openMainView(){
    window.location.replace("mainView.html")
}

function getSchedule(){
    const courses = [...scheduleDiv.querySelectorAll(".course-name")]
        .map(el => el.textContent.trim().toUpperCase());
    uploadSchedule(courses)
}

async function uploadSchedule(courses){
    const userId = auth.currentUser.uid
    try {
        await updateDoc(doc(db, `Students/${userId}`),
            {
                courses : courses
            }
        );
        alert(`account created successfully`)
        openMainView()
    } 
    catch (error) {
        console.error("Error adding friend:", error);
        alert(`error:WF-395 ${error}`)
    }
}