import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getListings, deleteListing } from '../../services/listings';
import './listing.css';

const MyListings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchMyListings();
        }
    }, [user]);

    const fetchMyListings = async () => {
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
    };

    const handleUpdate = (listingId) => {
        navigate(`/listing/${listingId}/edit`);
    };

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

    if (loading) {
        return <div className="loading">Loading your listings...</div>;
    }

    return (
        <div className="my-listings-container">
            <div className="listings-header">
                <h2>My Listings</h2>
                <Link to="/sell" className="create-listing-button">Create New Listing</Link>
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
                                {listing.pricingType === 'fixed' && (
                                    <p className="price">৳{listing.price?.toLocaleString()}</p>
                                )}
                                {listing.pricingType === 'bidding' && (
                                    <p className="price">Open to Bids</p>
                                )}
                                {listing.pricingType === 'negotiable' && (
                                    <p className="price">Price Negotiable</p>
                                )}
                                <p className="condition">{listing.condition}</p>
                                <p className="university">{listing.university}</p>
                                <div className="listing-actions">
                                    <button 
                                        className="edit-button"
                                        onClick={() => handleUpdate(listing.id)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="delete-button"
                                        onClick={() => handleDelete(listing.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyListings;
