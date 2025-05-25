import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import './ApprovePosts.css';

const ApprovePosts = () => {
    const { user } = useAuth();
    const [pendingListings, setPendingListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPendingItems();
    }, []);

    const fetchPendingItems = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch pending listings
            const pendingListingsSnapshot = await getDocs(collection(db, 'pending'));
            const listings = pendingListingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPendingListings(listings);
        } catch (error) {
            console.error('Error fetching pending items:', error);
            setError('Failed to load pending items. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (item) => {
        try {
            // Check if the current user is the creator of the listing
            if (item.userId === user.uid) {
                setError('You cannot approve your own listings');
                return;
            }

            const targetCollection = 'listings';
            const sourceCollection = 'pending';

            // Get the item from the pending collection
            const pendingItem = pendingListings.find(l => l.id === item.id);

            if (!pendingItem) {
                throw new Error('Item not found in pending collection');
            }

            // Create a new document in the target collection with the same data
            await setDoc(doc(db, targetCollection, item.id), {
                ...pendingItem,
                status: 'active',
                approvedAt: new Date(),
                approvedBy: user.uid // Add the approver's ID
            });

            // Delete the item from the pending collection
            await deleteDoc(doc(db, sourceCollection, item.id));

            // Update local state
            setPendingListings(pendingListings.filter(l => l.id !== item.id));
        } catch (error) {
            console.error('Error approving item:', error);
            setError('Failed to approve item. Please try again.');
        }
    };

    const handleReject = async (item) => {
        try {
            // Check if the current user is the creator of the listing
            if (item.userId === user.uid) {
                setError('You cannot reject your own listings');
                return;
            }

            const sourceCollection = 'pending';
            
            // Delete the item from the pending collection
            await deleteDoc(doc(db, sourceCollection, item.id));

            // Update local state
            setPendingListings(pendingListings.filter(l => l.id !== item.id));
        } catch (error) {
            console.error('Error rejecting item:', error);
            setError('Failed to reject item. Please try again.');
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="approve-posts-container">
            <h1>Approve Posts</h1>
            
            {error && <div className="error-message">{error}</div>}

            <div className="pending-items">
                {pendingListings.length === 0 ? (
                    <p className="no-items">No pending listings to approve</p>
                ) : (
                    pendingListings.map(listing => {
                        const isOwnListing = listing.userId === user.uid;
                        return (
                            <div key={listing.id} className="pending-item">
                                <div className="item-content">
                                    <h3>{listing.title}</h3>
                                    <p>{listing.description}</p>
                                    <p className="item-meta">
                                        <span>Price: ${listing.price}</span>
                                        <span>Category: {listing.category}</span>
                                        <span>Posted by: {listing.sellerEmail}</span>
                                        {isOwnListing && <span className="own-listing-badge">Your Listing</span>}
                                    </p>
                                </div>
                                <div className="item-actions">
                                    <button 
                                        className={`approve-button ${isOwnListing ? 'disabled' : ''}`}
                                        onClick={() => handleApprove(listing)}
                                        disabled={isOwnListing}
                                        title={isOwnListing ? "You cannot approve your own listings" : "Approve listing"}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        className={`reject-button ${isOwnListing ? 'disabled' : ''}`}
                                        onClick={() => handleReject(listing)}
                                        disabled={isOwnListing}
                                        title={isOwnListing ? "You cannot reject your own listings" : "Reject listing"}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ApprovePosts; 