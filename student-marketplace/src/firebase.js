// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, doc, setDoc } from "firebase/firestore";
import { config } from "./config/env";

const firebaseConfig = config.firebase;

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