import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getListingById, incrementViewCount, updateSellerRating } from '../../services/listings';
import './listing.css';
import MessageButton from "../../components/MessegeButton.jsx";

const ListingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [rating, setRating] = useState(0);
    const [showRatingModal, setShowRatingModal] = useState(false);

    useEffect(() => {
        fetchListing();
    }, [id]);

    const fetchListing = async () => {
        try {
            setLoading(true);
            setError('');
            const listingData = await getListingById(id);
            setListing(listingData);
            
            // Increment view count
            await incrementViewCount(id);
        } catch (error) {
            console.error('Error fetching listing:', error);
            setError('Failed to load listing. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingSubmit = async () => {
        try {
            if (!user) {
                throw new Error('You must be logged in to rate a seller');
            }

            if (rating === 0) {
                throw new Error('Please select a rating');
            }

            await updateSellerRating(id, rating);
            setShowRatingModal(false);
            fetchListing(); // Refresh listing data
        } catch (error) {
            console.error('Error submitting rating:', error);
            setError(error.message);
        }
    };

    if (loading) {
        return <div className="loading">Loading listing...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!listing) {
        return <div className="error-message">Listing not found</div>;
    }

    return (
        <div className="listing-detail-container">
            <div className="listing-images">
                <div className="main-image">
                    <img src={listing.images[selectedImage]} alt={listing.title} />
                </div>
                <div className="thumbnail-grid">
                    {listing.images.map((image, index) => (
                        <img
                            key={index}
                            src={image}
                            alt={`${listing.title} - Image ${index + 1}`}
                            className={`thumbnail ${selectedImage === index ? 'selected' : ''}`}
                            onClick={() => setSelectedImage(index)}
                        />
                    ))}
                </div>
            </div>

            <div className="listing-info">
                <h1>{listing.title}</h1>
                
                <div className="price-section">
                    {listing.pricingType === 'fixed' && (
                        <p className="price">৳{listing.price.toLocaleString()}</p>
                    )}
                    {listing.pricingType === 'bidding' && (
                        <p className="price">Open to Bids</p>
                    )}
                    {listing.pricingType === 'negotiable' && (
                        <p className="price">Price Negotiable</p>
                    )}
                </div>

                <div className="details-grid">
                    <div className="detail-item">
                        <span className="label">Condition:</span>
                        <span className="value">{listing.condition}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Category:</span>
                        <span className="value">{listing.category}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">University:</span>
                        <span className="value">{listing.university}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Posted:</span>
                        <span className="value">
                            {new Date(listing.createdAt?.toDate()).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <div className="description">
                    <h2>Description</h2>
                    <p>{listing.description}</p>
                </div>

                <div className="seller-info">
                    <h2>Seller Information</h2>
                    <div className="seller-details">
                        <p className="seller-name">{listing.sellerName}</p>
                        <div className="rating">
                            <span className="stars">★</span>
                            <span className="rating-value">
                                {listing.sellerRating ? listing.sellerRating.toFixed(1) : 'New'}
                            </span>
                            {listing.totalRatings > 0 && (
                                <span className="total-ratings">
                                    ({listing.totalRatings} {listing.totalRatings === 1 ? 'rating' : 'ratings'})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="action-buttons">
                    <MessageButton
                        listing={listing}
                        currentUser={{
                            id: user?.uid,
                            displayName: user?.displayName,
                            photoURL: user?.photoURL,
                        }}
                    />
                    {user && user.uid !== listing.userId && (
                        <button
                            className="rate-button"
                            onClick={() => setShowRatingModal(true)}
                        >
                            Rate Seller
                        </button>
                    )}
                </div>
            </div>

            {showRatingModal && (
                <div className="modal-overlay">
                    <div className="rating-modal">
                        <h2>Rate the Seller</h2>
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className={`star-button ${rating >= star ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <div className="modal-buttons">
                            <button
                                className="cancel-button"
                                onClick={() => setShowRatingModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="submit-button"
                                onClick={handleRatingSubmit}
                            >
                                Submit Rating
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListingDetail; 