import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { db } from "./firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";


const AuthContext = createContext();

export function AuthProvider({ children }) {    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const universityDomains = [
        "iut-dhaka.edu",
        "du.edu",
    ];

    function isUniversityEmail(email) {
        return universityDomains.some(domain => email.endsWith(`@${domain}`));
    }

    function signUp(email, password) {
        if (!isUniversityEmail(email)) {
            throw new Error("Please use your university email address");
        }
        return createUserWithEmailAndPassword(auth, email, password);
    }

    async function logIn(email, password) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (!result.user.emailVerified) {
            await auth.signOut();
            throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
        }
        return result;
    }

    function logOut() {
        return signOut(auth);
    }

    async function updateEmailVerificationStatus(user) {
        if (user && user.emailVerified) {
            const userRef = doc(db, "users", user.email);
            await updateDoc(userRef, {
                emailVerified: true
            });
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Check if user is suspended
                const userDoc = await getDoc(doc(db, "users", currentUser.email));
                if (userDoc.exists() && userDoc.data().suspended) {
                    // Sign out the user if they are suspended
                    await auth.signOut();
                    setUser(null);
                } else if (!currentUser.emailVerified) {
                    // Sign out if email is not verified
                    await auth.signOut();
                    setUser(null);
                } else {
                    // Update email verification status in Firestore
                    await updateEmailVerificationStatus(currentUser);
                    setUser(currentUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);




    const value = {
        user,
        signUp,
        logIn,
        logOut,
        isUniversityEmail
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}