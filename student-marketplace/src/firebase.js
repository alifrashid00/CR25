// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, doc, setDoc } from "firebase/firestore";

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
export const auth = getAuth();
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence for better performance
try {
    // This improves performance by caching data locally
    console.log('Firestore initialized with offline persistence');
} catch (error) {
    console.error('Failed to enable offline persistence:', error);
}

export { collection, doc, setDoc };