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

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roleLoading, setRoleLoading] = useState(false);

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
        try {
            setRoleLoading(true);
            const result = await signInWithEmailAndPassword(auth, email, password);
            
            if (!result.user.emailVerified) {
                await auth.signOut();
                throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
            }
            
            // Fetch user role immediately after successful login
            const userDoc = await getDoc(doc(db, "users", email));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.suspended) {
                    await auth.signOut();
                    throw new Error("Your account has been suspended. Please contact support.");
                }
                setUser(result.user);
                setUserRole(userData.isCoAdmin ? 'student' : userData.role);
            } else {
                await auth.signOut();
                throw new Error("User data not found. Please contact support.");
            }
            
            return result;
        } catch (error) {
            setUser(null);
            setUserRole(null);
            throw error;
        } finally {
            setRoleLoading(false);
        }
    }

    function logOut() {
        setUser(null);
        setUserRole(null);
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
                try {
                    setRoleLoading(true);
                    // Check if user is suspended
                    const userDoc = await getDoc(doc(db, "users", currentUser.email));
                    if (userDoc.exists()) {
                        if (userDoc.data().suspended) {
                            // Sign out the user if they are suspended
                            await auth.signOut();
                            setUser(null);
                            setUserRole(null);
                        } else if (!currentUser.emailVerified) {
                            // Sign out if email is not verified
                            await auth.signOut();
                            setUser(null);
                            setUserRole(null);
                        } else {
                            // Update email verification status in Firestore
                            await updateEmailVerificationStatus(currentUser);
                            setUser(currentUser);
                            // Set user role
                            const userData = userDoc.data();
                            setUserRole(userData.isCoAdmin ? 'student' : userData.role);
                        }
                    } else {
                        await auth.signOut();
                        setUser(null);
                        setUserRole(null);
                    }
                } catch (error) {
                    console.error("Error in auth state change:", error);
                    setUser(null);
                    setUserRole(null);
                } finally {
                    setRoleLoading(false);
                }
            } else {
                setUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const value = {
        user,
        userRole,
        loading,
        roleLoading,
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