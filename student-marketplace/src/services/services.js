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
    deleteDoc,
    serverTimestamp,
    increment,
    startAfter,
    onSnapshot,
    getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase';
import { getUserById } from './users';

const SERVICES_COLLECTION = 'services';
const SERVICES_PER_PAGE = 12;

// Create a new service
export const createService = async (serviceData, userId) => {
    try {
        let providerName = 'Anonymous';
        let providerEmail = '';

        try {
            const user = await getUserById(userId);
            providerName = user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.displayName || 'Anonymous';
            providerEmail = user.email || '';
        } catch (error) {
            console.error('Error fetching user data:', error);
        }

        const serviceWithMetadata = {
            ...serviceData,
            userId,
            providerName,
            providerEmail,
            createdAt: serverTimestamp(),
            status: 'active',
            views: 0,
            providerRating: 0,
            totalRatings: 0
        };

        const docRef = await addDoc(collection(db, SERVICES_COLLECTION), serviceWithMetadata);
        return { id: docRef.id, ...serviceWithMetadata };
    } catch (error) {
        console.error('Error creating service:', error);
        throw error;
    }
};

// Get services with advanced filtering and pagination
export const getServices = async (filters = {}, lastDoc = null) => {
    try {
        let q = collection(db, SERVICES_COLLECTION);
        
        // Apply filters if they exist
        if (filters.category) {
            q = query(q, where('category', '==', filters.category));
        }
        if (filters.skillLevel) {
            q = query(q, where('skillLevel', '==', filters.skillLevel));
        }
        if (filters.university) {
            q = query(q, where('university', '==', filters.university));
        }
        if (filters.userId) {
            q = query(q, where('userId', '==', filters.userId));
        }
        if (filters.availability) {
            q = query(q, where('availability', '==', filters.availability));
        }
        if (filters.hourlyRate) {
            const [min, max] = filters.hourlyRate.split('-').map(Number);
            if (min) q = query(q, where('hourlyRate', '>=', min));
            if (max) q = query(q, where('hourlyRate', '<=', max));
        }
        
        // Always filter by active status
        q = query(q, where('status', '==', 'active'));
        
        // Order by creation date
        q = query(q, orderBy('createdAt', 'desc'));
        
        // Apply pagination
        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }
        q = query(q, limit(SERVICES_PER_PAGE));
        
        const querySnapshot = await getDocs(q);
        const services = await Promise.all(querySnapshot.docs.map(async doc => {
            const serviceData = {
                id: doc.id,
                ...doc.data()
            };
            
            // Fetch user data if not already included
            if (!serviceData.providerName) {
                try {
                    const user = await getUserById(serviceData.userId);
                    serviceData.providerName = user.firstName + ' ' + user.lastName;
                    serviceData.providerEmail = user.email;
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    serviceData.providerName = 'Anonymous';
                }
            }
            
            return serviceData;
        }));

        // Get total count for pagination
        const countQuery = query(collection(db, SERVICES_COLLECTION), where('status', '==', 'active'));
        const totalCount = await getCountFromServer(countQuery);

        return {
            services,
            lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
            hasMore: querySnapshot.docs.length === SERVICES_PER_PAGE,
            totalCount: totalCount.data().count
        };
    } catch (error) {
        console.error('Error getting services:', error);
        throw error;
    }
};

// Get a single service by ID
export const getServiceById = async (id) => {
    try {
        const docRef = doc(db, SERVICES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error('Service not found');
        }

        const serviceData = {
            id: docSnap.id,
            ...docSnap.data()
        };

        // Fetch user data if not already included
        if (!serviceData.providerName) {
            try {
                const user = await getUserById(serviceData.userId);
                serviceData.providerName = user.firstName + ' ' + user.lastName;
                serviceData.providerEmail = user.email;
            } catch (error) {
                console.error('Error fetching user data:', error);
                serviceData.providerName = 'Anonymous';
            }
        }

        return serviceData;
    } catch (error) {
        console.error('Error getting service:', error);
        throw error;
    }
};

// Update a service
export const updateService = async (serviceId, updateData) => {
    try {
        const docRef = doc(db, SERVICES_COLLECTION, serviceId);
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        return { id: serviceId, ...updateData };
    } catch (error) {
        console.error('Error updating service:', error);
        throw error;
    }
};

// Delete a service (soft delete by updating status)
export const deleteService = async (serviceId) => {
    try {
        const docRef = doc(db, SERVICES_COLLECTION, serviceId);
        await updateDoc(docRef, {
            status: 'deleted',
            deletedAt: serverTimestamp()
        });
        return serviceId;
    } catch (error) {
        console.error('Error deleting service:', error);
        throw error;
    }
};

// Increment view count
export const incrementViewCount = async (id) => {
    try {
        const docRef = doc(db, SERVICES_COLLECTION, id);
        await updateDoc(docRef, {
            views: increment(1)
        });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        throw error;
    }
};

// Update provider rating
export const updateProviderRating = async (serviceId, rating) => {
    try {
        const docRef = doc(db, SERVICES_COLLECTION, serviceId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error('Service not found');
        }

        const service = docSnap.data();
        const currentRating = service.providerRating || 0;
        const totalRatings = service.totalRatings || 0;
        
        const newTotalRatings = totalRatings + 1;
        const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

        await updateDoc(docRef, {
            providerRating: newRating,
            totalRatings: newTotalRatings
        });

        return { id: serviceId, providerRating: newRating, totalRatings: newTotalRatings };
    } catch (error) {
        console.error('Error updating provider rating:', error);
        throw error;
    }
}; 