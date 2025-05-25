import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getListingById, incrementViewCount, updateSellerRating, deleteListing, markAsSold } from '../../services/listings';
import { createBid, getListingBids, getHighestBid } from '../../services/bids';
import { getListingReviews, createReview } from '../../services/reviews';
import LoadingSpinner from '../../components/LoadingSpinner';
import './listing-detail.css';
import MessageButton from "../../components/MessageButton";
import ExpertChat from "../../components/ExpertChat";



import './listing.css';

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
    const [bidAmount, setBidAmount] = useState('');
    const [bids, setBids] = useState([]);
    const [highestBid, setHighestBid] = useState(null);
    const [bidError, setBidError] = useState('');
    const [bidLoading, setBidLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const fetchListing = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const listingData = await getListingById(id);
            setListing(listingData);

            // Increment view count
            await incrementViewCount(id);

            // Fetch bids if this is a bidding listing
            if (listingData.pricingType === 'bidding') {
                const [bidsData, highestBidData] = await Promise.all([
                    getListingBids(id),
                    getHighestBid(id)
                ]);
                setBids(bidsData);
                setHighestBid(highestBidData);
            }
        } catch (error) {
            console.error('Error fetching listing:', error);
            setError('Failed to load listing. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchReviews = useCallback(async () => {
        try {
            setLoadingReviews(true);
            const reviewsData = await getListingReviews(id);
            setReviews(reviewsData);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    }, [id]);

    useEffect(() => {
        fetchListing();
        fetchReviews();
    }, [fetchListing, fetchReviews]);

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setBidError('Please log in to place a bid');
            return;
        }

        try {
            setBidLoading(true);
            setBidError('');
            const amount = parseFloat(bidAmount);

            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid bid amount');
            }

            if (highestBid && amount <= highestBid.amount) {
                throw new Error(`Your bid must be higher than the current highest bid of ৳${highestBid.amount.toLocaleString()}`);
            }

            if (isOwner) {
                throw new Error('You cannot bid on your own listing');
            }

            await createBid(id, user.uid, amount);
            setBidAmount('');

            // Refresh bids
            const [bidsData, highestBidData] = await Promise.all([
                getListingBids(id),
                getHighestBid(id)
            ]);
            setBids(bidsData);
            setHighestBid(highestBidData);
        } catch (error) {
            console.error('Error placing bid:', error);
            setBidError(error.message);
        } finally {
            setBidLoading(false);
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

    const handleMarkAsSold = async () => {
        if (window.confirm('Are you sure you want to mark this listing as sold? This will remove it from search results.')) {
            try {
                await markAsSold(id);
                navigate('/my-listings');
            } catch (error) {
                console.error('Error marking listing as sold:', error);
                setError('Failed to mark listing as sold. Please try again.');
            }
        }
    };

    if (loading) {
        return <LoadingSpinner size="large" />;
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
                        <div className="bidding-section">
                            <p className="price">
                                {highestBid
                                    ? `Highest Bid: ৳${highestBid.amount.toLocaleString()}`
                                    : 'No bids yet'}
                            </p>
                            {!isOwner && user && (
                                <form onSubmit={handleBidSubmit} className="bid-form">
                                    <div className="bid-input-group">
                                        <input
                                            type="number"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            placeholder="Enter your bid amount"
                                            min={highestBid ? highestBid.amount + 1 : 1}
                                            step="1"
                                            required
                                            disabled={bidLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={bidLoading}
                                        >
                                            {bidLoading ? (
                                                <LoadingSpinner size="small" />
                                            ) : (
                                                'Place Bid'
                                            )}
                                        </button>
                                    </div>
                                    {bidError && <p className="bid-error">{bidError}</p>}
                                </form>
                            )}
                            {bids.length > 0 && (
                                <div className="bids-history">
                                    <h3>Bid History</h3>
                                    <div className="bids-list">
                                        {bids.map(bid => (
                                            <div key={bid.id} className="bid-item">
                                                <span className="bidder-name">{bid.bidderName}</span>
                                                <span className="bid-amount">৳{bid.amount.toLocaleString()}</span>
                                                <span className="bid-time">
                                                    {new Date(bid.createdAt?.toDate()).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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
                            <button className="btn-edit" onClick={handleEdit}>
                                Edit Listing
                            </button>
                            <button className="btn-delete" onClick={handleDelete}>
                                Delete Listing
                            </button>
                            <button className="sold-button" onClick={handleMarkAsSold}>
                                Mark as Sold
                            </button>
                            {listing.pricingType === 'bidding' && (
                                <button 
                                    className="manage-bids-button" 
                                    onClick={() => navigate('/manage-bids')}
                                >
                                    Manage Bids
                                </button>
                            )}
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
                        </>
                    )}
                </div>
            </div>

            <div className="reviews-section">
                <h2>Reviews</h2>
                {loadingReviews ? (
                    <LoadingSpinner size="medium" />
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
            {/* Replace the old ask expert button with the new ExpertChat component */}
            <ExpertChat
                listing={listing}
                onClose={() => {/* Handle close if needed */}}
            />

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

                            <button className="submit-button" onClick={handleRatingSubmit}
                                    disabled={rating === 0}>Submit
                            </button>

                    </div>
                </div>
                </div>

            )}
        </div>
    );
};

export default ListingDetail;