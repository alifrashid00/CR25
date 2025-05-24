import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Get user data by ID (UID) or email
export const getUserById = async (userId) => {
    try {
        // First try to get by email (document ID)
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return {
                id: userSnap.id,
                ...userSnap.data()
            };
        }

        // If not found by email, try to find by UID
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        }

        throw new Error('User not found');
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
};

// Get user data by email
export const getUserByEmail = async (email) => {
    try {
        const userRef = doc(db, 'users', email);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        return {
            id: userSnap.id,
            ...userSnap.data()
        };
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
}; 