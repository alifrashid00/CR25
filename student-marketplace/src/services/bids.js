import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    limit,
    serverTimestamp,
    getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase';
import { getUserById } from './users';

const BIDS_COLLECTION = 'bids';

// Create a new bid
export const createBid = async (listingId, userId, amount) => {
    try {
        // Get user data for the bidder
        const user = await getUserById(userId);
        const bidderName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.displayName || 'Anonymous';

        const bidData = {
            listingId,
            userId,
            bidderName,
            amount,
            createdAt: serverTimestamp(),
            status: 'active'
        };

        const docRef = await addDoc(collection(db, BIDS_COLLECTION), bidData);
        return { id: docRef.id, ...bidData };
    } catch (error) {
        console.error('Error creating bid:', error);
        throw error;
    }
};

// Get all bids for a listing
export const getListingBids = async (listingId) => {
    try {
        // First try with the compound query
        try {
            const q = query(
                collection(db, BIDS_COLLECTION),
                where('listingId', '==', listingId),
                where('status', '==', 'active'),
                orderBy('amount', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            // If the index is not ready, fall back to a simpler query
            if (error.code === 'failed-precondition') {
                console.warn('Index not ready for getListingBids, falling back to simple query');
                const q = query(
                    collection(db, BIDS_COLLECTION),
                    where('listingId', '==', listingId),
                    where('status', '==', 'active')
                );

                const querySnapshot = await getDocs(q);
                const bids = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort bids manually
                return bids.sort((a, b) => b.amount - a.amount);
            }
            throw error;
        }
    } catch (error) {
        console.error('Error getting listing bids:', error);
        throw error;
    }
};

// Get the highest bid for a listing
export const getHighestBid = async (listingId) => {
    try {
        // First try with the compound query
        try {
            const q = query(
                collection(db, BIDS_COLLECTION),
                where('listingId', '==', listingId),
                where('status', '==', 'active'),
                orderBy('amount', 'desc'),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return null;
            }

            const highestBid = querySnapshot.docs[0];
            return {
                id: highestBid.id,
                ...highestBid.data()
            };
        } catch (error) {
            // If the index is not ready, fall back to a simpler query
            if (error.code === 'failed-precondition') {
                console.warn('Index not ready for getHighestBid, falling back to simple query');
                const q = query(
                    collection(db, BIDS_COLLECTION),
                    where('listingId', '==', listingId),
                    where('status', '==', 'active')
                );

                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    return null;
                }

                // Find the highest bid manually
                const bids = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const highestBid = bids.reduce((prev, current) => 
                    (prev.amount > current.amount) ? prev : current
                );

                return highestBid;
            }
            throw error;
        }
    } catch (error) {
        console.error('Error getting highest bid:', error);
        throw error;
    }
}; 