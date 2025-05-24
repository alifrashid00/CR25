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
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { getUserById } from './users';

const BIDS_COLLECTION = 'bids';

// Get or create a conversation between bidder and seller
const getOrCreateConversation = async (listingId, bidderId, sellerId) => {
    try {
        // Check if conversation already exists
        const q = query(
            collection(db, 'conversations'),
            where('listingId', '==', listingId),
            where('buyerId', '==', bidderId),
            where('sellerId', '==', sellerId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Existing conversation found
            return querySnapshot.docs[0].id;
        } else {
            // Create new conversation
            const docRef = await addDoc(collection(db, 'conversations'), {
                listingId,
                buyerId: bidderId,
                sellerId,
                lastMessage: '',
                updatedAt: serverTimestamp(),
            });
            return docRef.id;
        }
    } catch (error) {
        console.error('Error getting or creating conversation:', error);
        throw error;
    }
};

// Send notification message to seller about new bid
const sendBidNotification = async (conversationId, bidderName, amount, listingTitle) => {
    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const notificationText = `💰 New Bid Alert! ${bidderName} has placed a bid of ৳${amount.toLocaleString()} for "${listingTitle}". Would you like to accept this bid?`;
        
        await addDoc(messagesRef, {
            senderId: 'system', // System message
            text: notificationText,
            createdAt: serverTimestamp(),
            type: 'bid_notification',
            bidAmount: amount,
            bidderName: bidderName,
            listingTitle: listingTitle
        });
    } catch (error) {
        console.error('Error sending bid notification:', error);
        throw error;
    }
};

// Create a new bid
export const createBid = async (listingId, userId, amount) => {
    try {
        // Get user data for the bidder
        const user = await getUserById(userId);
        const bidderName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.displayName || 'Anonymous';

        // Get listing data to get seller info and title
        const listingDoc = await getDoc(doc(db, 'listings', listingId));
        if (!listingDoc.exists()) {
            throw new Error('Listing not found');
        }
        
        const listingData = listingDoc.data();
        const sellerId = listingData.userId;
        const listingTitle = listingData.title;

        const bidData = {
            listingId,
            userId,
            bidderName,
            amount,
            createdAt: serverTimestamp(),
            status: 'active'
        };

        const docRef = await addDoc(collection(db, BIDS_COLLECTION), bidData);
        
        // Create or get conversation and send notification
        const conversationId = await getOrCreateConversation(listingId, userId, sellerId);
        await sendBidNotification(conversationId, bidderName, amount, listingTitle);

        return { id: docRef.id, ...bidData };
    } catch (error) {
        console.error('Error creating bid:', error);
        throw error;
    }
};

// Accept a bid and mark listing as sold
export const acceptBid = async (bidId, listingId) => {
    try {
        // Update the bid status to accepted
        const bidRef = doc(db, BIDS_COLLECTION, bidId);
        await updateDoc(bidRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp()
        });

        // Update the listing status to sold
        const listingRef = doc(db, 'listings', listingId);
        await updateDoc(listingRef, {
            status: 'sold',
            soldAt: serverTimestamp(),
            acceptedBidId: bidId
        });

        // Update all other bids for this listing to rejected
        const bidsQuery = query(
            collection(db, BIDS_COLLECTION),
            where('listingId', '==', listingId),
            where('status', '==', 'active')
        );
        
        const bidsSnapshot = await getDocs(bidsQuery);
        const updatePromises = bidsSnapshot.docs
            .filter(doc => doc.id !== bidId)
            .map(doc => 
                updateDoc(doc.ref, {
                    status: 'rejected',
                    rejectedAt: serverTimestamp()
                })
            );
        
        await Promise.all(updatePromises);

        return { success: true, message: 'Bid accepted and listing marked as sold' };
    } catch (error) {
        console.error('Error accepting bid:', error);
        throw error;
    }
};

// Reject a bid
export const rejectBid = async (bidId) => {
    try {
        const bidRef = doc(db, BIDS_COLLECTION, bidId);
        await updateDoc(bidRef, {
            status: 'rejected',
            rejectedAt: serverTimestamp()
        });

        return { success: true, message: 'Bid rejected' };
    } catch (error) {
        console.error('Error rejecting bid:', error);
        throw error;
    }
};

// Get bids for a specific seller (all their listings)
export const getSellerBids = async (sellerId) => {
    try {
        console.log('getSellerBids called with sellerId:', sellerId);
        
        // First get all listings by the seller
        const listingsQuery = query(
            collection(db, 'listings'),
            where('userId', '==', sellerId)
        );
        const listingsSnapshot = await getDocs(listingsQuery);
        const listingIds = listingsSnapshot.docs.map(doc => doc.id);
        
        console.log('Found listings for seller:', listingIds);
        console.log('Listing data:', listingsSnapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title })));

        if (listingIds.length === 0) {
            console.log('No listings found for seller');
            return [];
        }

        // Get all bids for these listings
        const bidsQuery = query(
            collection(db, BIDS_COLLECTION),
            where('listingId', 'in', listingIds),
            orderBy('createdAt', 'desc')
        );

        const bidsSnapshot = await getDocs(bidsQuery);
        console.log('Found bids:', bidsSnapshot.docs.length);
        
        const bids = bidsSnapshot.docs.map(doc => {
            const bidData = { id: doc.id, ...doc.data() };
            console.log('Processing bid:', bidData);
            
            // Add listing title from our listings data
            const listing = listingsSnapshot.docs.find(listingDoc => listingDoc.id === bidData.listingId);
            if (listing) {
                bidData.listingTitle = listing.data().title;
                console.log('Added listing title:', bidData.listingTitle);
            } else {
                console.log('No listing found for bid listingId:', bidData.listingId);
            }
            return bidData;
        });

        console.log('Final processed bids:', bids);
        return bids;
    } catch (error) {
        console.error('Error getting seller bids:', error);
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