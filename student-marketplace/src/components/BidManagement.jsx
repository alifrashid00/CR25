import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { getSellerBids, acceptBid, rejectBid } from '../services/bids';
import LoadingSpinner from './LoadingSpinner';
import './BidManagement.css';

const BidManagement = () => {
    const { user } = useAuth();
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');    const [processingBid, setProcessingBid] = useState(null);

    const fetchBids = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching bids for seller:', user.uid);
            const bidsData = await getSellerBids(user.uid);
            console.log('Fetched bids data:', bidsData);
            setBids(bidsData);
        } catch (error) {
            console.error('Error fetching bids:', error);
            setError('Failed to load bids. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        if (user) {
            fetchBids();
        }
    }, [user, fetchBids]);

    const handleAcceptBid = async (bidId, listingId) => {
        if (!window.confirm('Are you sure you want to accept this bid? This will mark your listing as sold and reject all other bids.')) {
            return;
        }

        try {
            setProcessingBid(bidId);
            await acceptBid(bidId, listingId);
            
            // Refresh bids after accepting
            await fetchBids();
            alert('Bid accepted successfully! Your listing has been marked as sold.');
        } catch (error) {
            console.error('Error accepting bid:', error);
            setError('Failed to accept bid. Please try again.');
        } finally {
            setProcessingBid(null);
        }
    };

    const handleRejectBid = async (bidId) => {
        if (!window.confirm('Are you sure you want to reject this bid?')) {
            return;
        }

        try {
            setProcessingBid(bidId);
            await rejectBid(bidId);
            
            // Refresh bids after rejecting
            await fetchBids();
            alert('Bid rejected successfully.');
        } catch (error) {
            console.error('Error rejecting bid:', error);
            setError('Failed to reject bid. Please try again.');
        } finally {
            setProcessingBid(null);
        }
    };

    const getBidStatusColor = (status) => {
        switch (status) {
            case 'active': return '#2563eb';
            case 'accepted': return '#059669';
            case 'rejected': return '#dc2626';
            default: return '#6b7280';
        }
    };

    const getBidStatusText = (status) => {
        switch (status) {
            case 'active': return 'Pending';
            case 'accepted': return 'Accepted';
            case 'rejected': return 'Rejected';
            default: return status;
        }
    };    if (loading) {
        return <LoadingSpinner size="large" />;
    }

    return (
        <div className="bid-management-container">
            <div className="bid-management-header">
                <h2>Manage Bids</h2>
                <p>Review and respond to bids on your listings</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {bids.length === 0 ? (
                <div className="no-bids">
                    <h3>No bids yet</h3>
                    <p>When buyers place bids on your listings, they'll appear here.</p>
                </div>
            ) : (
                <div className="bids-list">
                    {bids.map(bid => (
                        <div key={bid.id} className="bid-card">
                            <div className="bid-header">
                                <h3 className="listing-title">{bid.listingTitle}</h3>
                                <span 
                                    className="bid-status"
                                    style={{ color: getBidStatusColor(bid.status) }}
                                >
                                    {getBidStatusText(bid.status)}
                                </span>
                            </div>
                            
                            <div className="bid-details">
                                <div className="bid-info">
                                    <div className="bidder-info">
                                        <strong>Bidder:</strong> {bid.bidderName}
                                    </div>
                                    <div className="bid-amount">
                                        <strong>Bid Amount:</strong> ৳{bid.amount.toLocaleString()}
                                    </div>
                                    <div className="bid-date">
                                        <strong>Placed:</strong> {new Date(bid.createdAt?.toDate()).toLocaleString()}
                                    </div>
                                </div>                                {bid.status === 'active' && (
                                    <div className="bid-actions">
                                        <button
                                            className="accept-btn"
                                            onClick={() => handleAcceptBid(bid.id, bid.listingId)}
                                            disabled={processingBid === bid.id}
                                        >                                            {processingBid === bid.id ? (
                                                <LoadingSpinner size="small" />
                                            ) : (
                                                'Accept Bid'
                                            )}
                                        </button>
                                        <button
                                            className="reject-btn"
                                            onClick={() => handleRejectBid(bid.id)}
                                            disabled={processingBid === bid.id}
                                        >                                            {processingBid === bid.id ? (
                                                <LoadingSpinner size="small" />
                                            ) : (
                                                'Reject Bid'
                                            )}
                                        </button>
                                    </div>
                                )}

                                {bid.status === 'accepted' && (
                                    <div className="accepted-info">
                                        <span className="accepted-text">✅ Accepted on {new Date(bid.acceptedAt?.toDate()).toLocaleString()}</span>
                                    </div>
                                )}

                                {bid.status === 'rejected' && (
                                    <div className="rejected-info">
                                        <span className="rejected-text">❌ Rejected on {new Date(bid.rejectedAt?.toDate()).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BidManagement;
