import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";


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

    function logIn(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logOut() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
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