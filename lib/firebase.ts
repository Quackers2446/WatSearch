// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDahbA2cKzO4B-88077iuGDDlM1-lMYcCc",
    authDomain: "watsearch-a8c9b.firebaseapp.com",
    projectId: "watsearch-a8c9b",
    storageBucket: "watsearch-a8c9b.firebasestorage.app",
    messagingSenderId: "172319961836",
    appId: "1:172319961836:web:39ebc021f8b9e5a0cfebc9",
}

// Initialize Firebase
// Use singleton pattern to avoid multiple initializations
let app: FirebaseApp

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
} else {
    app = getApps()[0]
}

export const auth = getAuth()
export const firestore = getFirestore()

export default app
