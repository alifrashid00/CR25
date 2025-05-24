import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getListingById, incrementViewCount, updateSellerRating, deleteListing } from '../../services/listings';
import { createReview, getListingReviews } from '../../services/reviews';
import './listing.css';
import MessageButton from "../../components/MessageButton.jsx";
const ListingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        fetchListing();
        fetchReviews();
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

    const fetchReviews = async () => {
        try {
            setLoadingReviews(true);
            const reviewsData = await getListingReviews(id);
            setReviews(reviewsData);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
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

            // Update seller rating
            await updateSellerRating(id, rating);

            // Create review if text is provided
            if (review.trim()) {
                await createReview({
                    listingId: id,
                    sellerId: listing.userId,
                    buyerId: user.uid,
                    buyerName: user.displayName,
                    rating,
                    review: review.trim(),
                    listingTitle: listing.title
                });
            }

            setShowRatingModal(false);
            setRating(0);
            setReview('');
            fetchListing();
            fetchReviews();
        } catch (error) {
            console.error('Error submitting rating:', error);
            setError(error.message);
        }
    };

    const handleEdit = () => {
        navigate(`/listing/${id}/edit`);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                await deleteListing(id);
                navigate('/my-listings');
            } catch (error) {
                console.error('Error deleting listing:', error);
                setError('Failed to delete listing. Please try again.');
            }
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

    const isOwner = user && user.uid === listing.userId;

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
                    {isOwner ? (
                        <>
                            <button className="edit-button" onClick={handleEdit}>
                                Edit Listing
                            </button>
                            <button className="delete-button" onClick={handleDelete}>
                                Delete Listing
                            </button>
                        </>
                    ) : (
                        <>
                            {!isOwner && (
                                <>
                                    <MessageButton
                                        listing={listing}
                                        currentUser={{
                                            id: user?.uid,
                                            displayName: user?.displayName,
                                            photoURL: user?.photoURL,
                                        }}
                                    />
                                    {user && (
                                        <button
                                            className="rate-button"
                                            onClick={() => setShowRatingModal(true)}
                                        >
                                            Rate Seller
                                        </button>
                                    )}
                                </>
                            )}
                            {user && (
                                <button
                                    className="rate-button"
                                    onClick={() => setShowRatingModal(true)}
                                >
                                    Rate Seller
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="reviews-section">
                <h2>Reviews</h2>
                {loadingReviews ? (
                    <div className="loading">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="no-reviews">No reviews yet</div>
                ) : (
                    <div className="reviews-list">
                        {reviews.map(review => (
                            <div key={review.id} className="review-card">
                                <div className="review-header">
                                    <span className="reviewer-name">{review.buyerName}</span>
                                    <div className="review-rating">
                                        {'★'.repeat(review.rating)}
                                        {'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                                <p className="review-text">{review.review}</p>
                                <span className="review-date">
                                    {new Date(review.createdAt?.toDate()).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
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
                        <div className="review-input">
                            <textarea
                                placeholder="Write your review (optional)"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="modal-buttons">
                            <button
                                className="cancel-button"
                                onClick={() => {
                                    setShowRatingModal(false);
                                    setRating(0);
                                    setReview('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="submit-button"
                                onClick={handleRatingSubmit}
                                disabled={rating === 0}
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