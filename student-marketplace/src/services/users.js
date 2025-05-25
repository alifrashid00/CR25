import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { cache } from './cache';

// Batch get multiple users by IDs to reduce database calls
export const getUsersByIds = async (userIds) => {
    try {
        const uniqueIds = [...new Set(userIds)];
        const users = new Map();
        const uncachedIds = [];

        // Check cache first
        for (const userId of uniqueIds) {
            const cached = cache.get(`user_${userId}`);
            if (cached) {
                users.set(userId, cached);
            } else {
                uncachedIds.push(userId);
            }
        }

        // Fetch uncached users
        if (uncachedIds.length > 0) {
            // Use batched queries for better performance
            const batchSize = 10; // Firestore 'in' query limit
            const batches = [];
            
            for (let i = 0; i < uncachedIds.length; i += batchSize) {
                const batch = uncachedIds.slice(i, i + batchSize);
                batches.push(batch);
            }

            for (const batch of batches) {
                const q = query(collection(db, 'users'), where('uid', 'in', batch));
                const querySnapshot = await getDocs(q);
                
                querySnapshot.docs.forEach(doc => {
                    const userData = {
                        id: doc.id,
                        ...doc.data()
                    };
                    users.set(userData.uid, userData);
                    cache.set(`user_${userData.uid}`, userData);
                });
            }
        }

        return users;
    } catch (error) {
        console.error('Error getting users by IDs:', error);
        throw error;
    }
};

// Get user data by ID (UID) or email
export const getUserById = async (userId) => {
    try {
        // Check cache first
        const cached = cache.get(`user_${userId}`);
        if (cached) {
            return cached;
        }

        // First try to get by email (document ID)
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = {
                id: userSnap.id,
                ...userSnap.data()
            };
            cache.set(`user_${userId}`, userData);
            return userData;
        }

        // If not found by email, try to find by UID
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = {
                id: userDoc.id,
                ...userDoc.data()
            };
            cache.set(`user_${userId}`, userData);
            return userData;
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