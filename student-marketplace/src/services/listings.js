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
    updateDoc,
    serverTimestamp,
    increment,
    startAfter,
    onSnapshot,
    getCountFromServer,
    deleteDoc,
    setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { getUserById, getUsersByIds } from './users';
import { cache } from './cache';

const LISTINGS_COLLECTION = 'listings';
const PENDING_COLLECTION = 'pending';
const LISTINGS_PER_PAGE = 12;

// Create a new listing
export const createListing = async (listingData, userId) => {
    try {
        let sellerName = 'Anonymous';
        let sellerEmail = '';
        let sellerRating = 0;
        let totalRatings = 0;

        try {
            const user = await getUserById(userId);
            sellerName = user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.displayName || 'Anonymous';
            sellerEmail = user.email || '';
            sellerRating = user.rating || 0;
            totalRatings = user.totalRatings || 0;
        } catch (error) {
            console.error('Error fetching user data:', error);
        }

        const listingWithMetadata = {
            ...listingData,
            userId,
            sellerName,
            sellerEmail,
            sellerRating,
            totalRatings,
            createdAt: serverTimestamp(),
            status: 'pending',
            views: 0,
            likes: 0
        };

        // Add to pending collection
        const docRef = await addDoc(collection(db, PENDING_COLLECTION), listingWithMetadata);
        return { id: docRef.id, ...listingWithMetadata };
    } catch (error) {
        console.error('Error creating listing:', error);
        throw error;
    }
};

// Get pending listings
export const getPendingListings = async () => {
    try {
        const pendingSnapshot = await getDocs(collection(db, PENDING_COLLECTION));
        return pendingSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting pending listings:', error);
        throw error;
    }
};

// Approve a pending listing
export const approveListing = async (listingId, approverId) => {
    try {
        // Get the pending listing
        const pendingDoc = await getDoc(doc(db, PENDING_COLLECTION, listingId));
        if (!pendingDoc.exists()) {
            throw new Error('Pending listing not found');
        }

        const pendingData = pendingDoc.data();

        // Check if the approver is the creator
        if (pendingData.userId === approverId) {
            throw new Error('You cannot approve your own listings');
        }

        // Create the listing in the listings collection
        await setDoc(doc(db, LISTINGS_COLLECTION, listingId), {
            ...pendingData,
            status: 'active',
            approvedAt: serverTimestamp(),
            approvedBy: approverId
        });

        // Delete from pending collection
        await deleteDoc(doc(db, PENDING_COLLECTION, listingId));

        return { success: true };
    } catch (error) {
        console.error('Error approving listing:', error);
        throw error;
    }
};

// Reject a pending listing
export const rejectListing = async (listingId, rejecterId) => {
    try {
        // Get the pending listing
        const pendingDoc = await getDoc(doc(db, PENDING_COLLECTION, listingId));
        if (!pendingDoc.exists()) {
            throw new Error('Pending listing not found');
        }

        const pendingData = pendingDoc.data();

        // Check if the rejecter is the creator
        if (pendingData.userId === rejecterId) {
            throw new Error('You cannot reject your own listings');
        }

        // Delete from pending collection
        await deleteDoc(doc(db, PENDING_COLLECTION, listingId));

        return { success: true };
    } catch (error) {
        console.error('Error rejecting listing:', error);
        throw error;
    }
};

// Get listings with advanced filtering and pagination
export const getListings = async (filters = {}, lastDoc = null) => {
    try {
        // Generate cache key based on filters
        const cacheKey = `listings_${JSON.stringify(filters)}_${lastDoc ? lastDoc.id : 'first'}`;
        
        // Check cache first for non-real-time data
        if (!filters.realTime) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        }

        let q = collection(db, LISTINGS_COLLECTION);
        
        // Apply filters if they exist
        if (filters.category) {
            q = query(q, where('category', '==', filters.category));
        }
        if (filters.condition) {
            q = query(q, where('condition', '==', filters.condition));
        }
        if (filters.university) {
            q = query(q, where('university', '==', filters.university));
        }
        if (filters.userId) {
            q = query(q, where('userId', '==', filters.userId));
        }
        if (filters.priceRange) {
            const [min, max] = filters.priceRange.split('-').map(Number);
            if (min) q = query(q, where('price', '>=', min));
            if (max) q = query(q, where('price', '<=', max));
        }
        if (filters.pricingType) {
            q = query(q, where('pricingType', '==', filters.pricingType));
        }
        if (filters.visibility) {
            q = query(q, where('visibility', '==', filters.visibility));
        }
        
        // Always filter by active status
        q = query(q, where('status', '==', 'active'));
        
        // Order by creation date
        q = query(q, orderBy('createdAt', 'desc'));
        
        // Apply pagination
        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }
        q = query(q, limit(LISTINGS_PER_PAGE));
          const querySnapshot = await getDocs(q);
        
        // Extract unique user IDs
        const userIds = [...new Set(querySnapshot.docs.map(doc => doc.data().userId))];
        
        // Batch fetch user data
        const usersMap = await getUsersByIds(userIds);
        
        const listings = querySnapshot.docs.map(doc => {
            const listingData = {
                id: doc.id,
                ...doc.data()
            };
            
            // Add user data from batch fetch
            const user = usersMap.get(listingData.userId);
            if (user) {
                listingData.sellerName = user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.displayName || 'Anonymous';
                listingData.sellerEmail = user.email || '';
            } else {
                listingData.sellerName = 'Anonymous';
                listingData.sellerEmail = '';
            }
            
            return listingData;
        });        // Get total count for pagination
        const countQuery = query(collection(db, LISTINGS_COLLECTION), where('status', '==', 'active'));
        const totalCount = await getCountFromServer(countQuery);

        const result = {
            listings,
            lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
            hasMore: querySnapshot.docs.length === LISTINGS_PER_PAGE,
            totalCount: totalCount.data().count
        };

        // Cache the result for faster subsequent access
        if (!filters.realTime) {
            cache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes for listings
        }

        return result;
    } catch (error) {
        console.error('Error getting listings:', error);
        throw error;
    }
};

// Subscribe to real-time listing updates with advanced filtering
export const subscribeToListings = (filters = {}, callback) => {
    try {
        let q = collection(db, LISTINGS_COLLECTION);
        
        // Apply equality filters first
        if (filters.category) {
            q = query(q, where('category', '==', filters.category));
        }
        if (filters.condition) {
            q = query(q, where('condition', '==', filters.condition));
        }
        if (filters.university) {
            q = query(q, where('university', '==', filters.university));
        }
        if (filters.pricingType) {
            q = query(q, where('pricingType', '==', filters.pricingType));
        }
        if (filters.visibility) {
            q = query(q, where('visibility', '==', filters.visibility));
        }
        
        // Always filter by active status
        q = query(q, where('status', '==', 'active'));

        // Apply price range filter if it exists
        if (filters.priceRange) {
            const [min, max] = filters.priceRange.split('-').map(Number);
            if (min !== undefined && max !== undefined) {
                q = query(q, where('price', '>=', min), where('price', '<=', max));
            } else if (min !== undefined) {
                q = query(q, where('price', '>=', min));
            } else if (max !== undefined) {
                q = query(q, where('price', '<=', max));
            }
        }

        // Order by creation date
        q = query(q, orderBy('createdAt', 'desc'));
        q = query(q, limit(LISTINGS_PER_PAGE));

        return onSnapshot(q, (snapshot) => {
            const listings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(listings);
        });
    } catch (error) {
        console.error('Error subscribing to listings:', error);
        throw error;
    }
};

// Get a single listing by ID
export const getListingById = async (id) => {
    try {
        // Check cache first
        const cacheKey = `listing_${id}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const docRef = doc(db, LISTINGS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error('Listing not found');
        }

        const listingData = {
            id: docSnap.id,
            ...docSnap.data()
        };

        // Fetch user data if not already included
        if (!listingData.sellerName) {
            try {
                const user = await getUserById(listingData.userId);
                listingData.sellerName = user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.displayName || 'Anonymous';
                listingData.sellerEmail = user.email || '';
            } catch (error) {
                console.error('Error fetching user data:', error);
                listingData.sellerName = 'Anonymous';
                listingData.sellerEmail = '';
            }
        }

        // Cache the result
        cache.set(cacheKey, listingData, 2 * 60 * 1000); // 2 minutes cache
        return listingData;
    } catch (error) {
        console.error('Error getting listing:', error);
        throw error;
    }
};

// Update a listing
export const updateListing = async (listingId, updateData) => {
    try {
        const docRef = doc(db, LISTINGS_COLLECTION, listingId);
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        return { id: listingId, ...updateData };
    } catch (error) {
        console.error('Error updating listing:', error);
        throw error;
    }
};

// Delete a listing (soft delete by updating status)
export const deleteListing = async (listingId) => {
    try {
        const docRef = doc(db, LISTINGS_COLLECTION, listingId);
        await updateDoc(docRef, {
            status: 'deleted',
            deletedAt: serverTimestamp()
        });
        return listingId;
    } catch (error) {
        console.error('Error deleting listing:', error);
        throw error;
    }
};

// Mark a listing as sold
export const markAsSold = async (listingId) => {
    try {
        const docRef = doc(db, LISTINGS_COLLECTION, listingId);
        await updateDoc(docRef, {
            status: 'sold',
            soldAt: serverTimestamp()
        });
        return listingId;
    } catch (error) {
        console.error('Error marking listing as sold:', error);
        throw error;
    }
};

// Search listings by text with pagination
export const searchListings = async (searchQuery, lastDoc = null) => {
    try {
        const { listings, lastDoc: newLastDoc, hasMore, totalCount } = await getListings({}, lastDoc);
        const filteredListings = listings.filter(listing => 
            listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            listing.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return {
            listings: filteredListings,
            lastDoc: newLastDoc,
            hasMore,
            totalCount
        };
    } catch (error) {
        console.error('Error searching listings:', error);
        throw error;
    }
};

// Increment view count
export const incrementViewCount = async (id) => {
    try {
        const docRef = doc(db, 'listings', id);
        await updateDoc(docRef, {
            views: increment(1)
        });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        throw error;
    }
};

// Update seller rating
export const updateSellerRating = async (listingId, rating) => {
    try {
        const listingRef = doc(db, 'listings', listingId);
        const listingSnap = await getDoc(listingRef);

        if (!listingSnap.exists()) {
            throw new Error('Listing not found');
        }

        const listing = listingSnap.data();
        const currentRating = listing.sellerRating || 0;
        const totalRatings = listing.totalRatings || 0;

        // Calculate new average rating
        const newTotalRatings = totalRatings + 1;
        const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

        // Update the listing with new rating
        await updateDoc(listingRef, {
            sellerRating: newRating,
            totalRatings: newTotalRatings
        });

        // Update seller's overall rating in users collection
        const sellerRef = doc(db, 'users', listing.userId);
        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
            const seller = sellerSnap.data();
            const sellerCurrentRating = seller.rating || 0;
            const sellerTotalRatings = seller.totalRatings || 0;

            const newSellerTotalRatings = sellerTotalRatings + 1;
            const newSellerRating = ((sellerCurrentRating * sellerTotalRatings) + rating) / newSellerTotalRatings;

            await updateDoc(sellerRef, {
                rating: newSellerRating,
                totalRatings: newSellerTotalRatings
            });
        }

        return {
            newRating,
            newTotalRatings
        };
    } catch (error) {
        console.error('Error updating seller rating:', error);
        throw error;
    }
}; 