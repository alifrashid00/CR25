import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const REVIEWS_COLLECTION = 'reviews';

// Create a new review
export const createReview = async (reviewData) => {
    try {
        const reviewWithMetadata = {
            ...reviewData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewWithMetadata);
        return { id: docRef.id, ...reviewWithMetadata };
    } catch (error) {
        console.error('Error creating review:', error);
        throw error;
    }
};

// Get reviews for a seller
export const getSellerReviews = async (sellerId) => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where('sellerId', '==', sellerId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting seller reviews:', error);
        throw error;
    }
};

// Get reviews for a listing
export const getListingReviews = async (listingId) => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where('listingId', '==', listingId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting listing reviews:', error);
        throw error;
    }
};

// Update a review
export const updateReview = async (reviewId, reviewData) => {
    try {
        const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
        await updateDoc(reviewRef, {
            ...reviewData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating review:', error);
        throw error;
    }
}; 