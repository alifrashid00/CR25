// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import { getAuth } from "firebase/auth";
const firebaseConfig = {
    apiKey: "AIzaSyDFxX-eXGr_UJtg5IKx8i0NU8uzMZNLb34",
    authDomain: "coderush-a742b.firebaseapp.com",
    projectId: "coderush-a742b",
    storageBucket: "coderush-a742b.firebasestorage.app",
    messagingSenderId: "575921249414",
    appId: "1:575921249414:web:440af03eddc0c406da0507",
    measurementId: "G-46Y9DJSB5P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);
export default app;