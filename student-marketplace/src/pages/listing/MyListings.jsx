import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getListings, deleteListing, markAsSold } from '../../services/listings';
import ChatListModal from "../../modal/ChatListModal.jsx";
import './listing.css';

const MyListings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedListing, setSelectedListing] = useState(null);

    const fetchMyListings = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const { listings } = await getListings({ userId: user.uid });
            setListings(listings);
        } catch (error) {
            console.error('Error fetching listings:', error);
            setError('Failed to load your listings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        if (user) fetchMyListings();
    }, [user, fetchMyListings]);

    const handleUpdate = (listingId) => navigate(`/listing/${listingId}/edit`);

    const handleDelete = async (listingId) => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                await deleteListing(listingId);
                setListings(listings.filter(listing => listing.id !== listingId));
            } catch (error) {
                console.error('Error deleting listing:', error);
                setError('Failed to delete listing. Please try again.');
            }
        }
    };

    const handleMarkAsSold = async (listingId) => {
        if (window.confirm('Are you sure you want to mark this listing as sold? This will remove it from search results.')) {
            try {
                await markAsSold(listingId);
                setListings(listings.filter(listing => listing.id !== listingId));
            } catch (error) {
                console.error('Error marking listing as sold:', error);
                setError('Failed to mark listing as sold. Please try again.');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading your listings...</div>;
    }

    return (
        <div className="my-listings-container">
            <div className="listings-header">
                <h2>My Listings</h2>
                <div className="header-actions">
                    <Link to="/manage-bids" className="manage-bids-link">Manage Bids</Link>
                    <Link to="/sell" className="create-listing-button">Create New Listing</Link>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="listings-grid">
                {listings.length === 0 ? (
                    <div className="no-listings">You have no active listings.</div>
                ) : (
                    listings.map(listing => (
                        <div key={listing.id} className="listing-card">
                            <div className="listing-image">
                                <img src={listing.images[0]} alt={listing.title} />
                            </div>
                            <div className="listing-details">
                                <h3>{listing.title}</h3>
                                <p className="price">
                                    {listing.pricingType === 'fixed' && `৳${listing.price?.toLocaleString()}`}
                                    {listing.pricingType === 'bidding' && 'Open to Bids'}
                                    {listing.pricingType === 'negotiable' && 'Price Negotiable'}
                                </p>
                                <p className="condition">{listing.condition}</p>
                                <p className="university">{listing.university}</p>
                                <div className="button-group">
                                    <button className="mini-button " onClick={() => handleUpdate(listing.id)}>Edit</button>
                                    <button className="mini-button " onClick={() => handleDelete(listing.id)}>Delete</button>
                                    <button className="mini-button sold-button" onClick={() => handleMarkAsSold(listing.id)}>Mark as Sold</button>
                                    <button
                                        className="mini-button"
                                        onClick={() => setSelectedListing(listing)}
                                    >
                                        View Chats
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedListing && (() => {
                console.log("Opening ChatListModal for:", selectedListing?.id);
                return (
                    <ChatListModal
                        listing={selectedListing}
                        sellerId={user.uid}
                        onClose={() => setSelectedListing(null)}
                    />
                );
            })()}
        </div>
    );
};

export default MyListings;
