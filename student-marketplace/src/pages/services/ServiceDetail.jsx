import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getServiceById, incrementViewCount, updateProviderRating, deleteService } from '../../services/services';
import './service-detail.css';
import MessageButton from "../../components/MessegeButton.jsx";

const ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rating, setRating] = useState(0);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        show: false,
        email: '',
        phone: ''
    });

    useEffect(() => {
        const fetchService = async () => {
            try {
                setLoading(true);
                setError('');
                const serviceData = await getServiceById(id);
                setService(serviceData);
                await incrementViewCount(id);
            } catch (error) {
                console.error('Error fetching service:', error);
                setError('Failed to load service details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [id]);

    const handleRatingSubmit = async () => {
        if (!user) {
            setError('Please log in to rate this service');
            return;
        }

        try {
            await updateProviderRating(id, rating);
            setService(prev => ({
                ...prev,
                providerRating: ((prev.providerRating * prev.totalRatings) + rating) / (prev.totalRatings + 1),
                totalRatings: prev.totalRatings + 1
            }));
            setShowRatingModal(false);
            setRating(0);
        } catch (error) {
            console.error('Error submitting rating:', error);
            setError('Failed to submit rating. Please try again.');
        }
    };

    const handleContact = () => {
        if (!user) {
            setError('Please log in to contact the service provider');
            return;
        }
        setContactInfo({
            show: true,
            email: service.providerEmail,
            phone: service.providerPhone || 'Not provided'
        });
    };

    const handleEdit = () => {
        navigate(`/services/${id}/edit`);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            try {
                await deleteService(id);
                navigate('/my-services');
            } catch (error) {
                console.error('Error deleting service:', error);
                setError('Failed to delete service. Please try again.');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading service details...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!service) {
        return <div className="error-message">Service not found</div>;
    }

    const isOwner = user && user.uid === service.userId;

    return (
        <div className="service-detail-container">
            <div className="service-detail-content">
                <div className="service-header">
                    <div className="service-title-section">
                        <h1>{service.title}</h1>
                        <div className="service-meta">
                            <span className="category">{service.category}</span>
                            <span className="views">{service.views} views</span>
                        </div>
                    </div>
                    <div className="service-price">
                        <span className="rate">৳{service.hourlyRate}</span>
                        <span className="per-hour">/hour</span>
                    </div>
                </div>

                <div className="service-main">
                    <div className="service-image">
                        <img src={service.profileImage || '/default-service.jpg'} alt={service.title} />
                    </div>

                    <div className="service-info">
                        <div className="info-section">
                            <h2>Description</h2>
                            <p>{service.description}</p>
                        </div>

                        <div className="info-section">
                            <h2>Skills</h2>
                            <div className="skills-list">
                                {service.skills.map((skill, index) => (
                                    <span key={index} className="skill-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="info-section">
                            <h2>Details</h2>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="label">Skill Level</span>
                                    <span className="value">{service.skillLevel}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Availability</span>
                                    <span className="value">{service.availability}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">University</span>
                                    <span className="value">{service.university}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="provider-section">
                    <div className="provider-info">
                        <img 
                            src={service.providerImage || '/default-avatar.png'} 
                            alt={service.providerName} 
                            className="provider-avatar"
                        />
                        <div className="provider-details">
                            <h3>{service.providerName}</h3>
                            <div className="provider-rating">
                                <span className="stars">★</span>
                                <span className="rating-value">
                                    {service.providerRating ? service.providerRating.toFixed(1) : 'New'}
                                </span>
                                <span className="rating-count">
                                    ({service.totalRatings || 0} ratings)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="provider-actions">
                        {isOwner ? (
                            <>
                                <button className="edit-button" onClick={handleEdit}>
                                    Edit Service
                                </button>
                                <button className="delete-button" onClick={handleDelete}>
                                    Delete Service
                                </button>
                            </>
                        ) : (
                            <>
                                <MessageButton
                                    service={service}
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
                                        Rate Provider
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {contactInfo.show && (
                    <div className="contact-modal">
                        <div className="contact-content">
                            <h3>Contact Information</h3>
                            <p>Email: {contactInfo.email}</p>
                            <p>Phone: {contactInfo.phone}</p>
                            <button 
                                className="close-button"
                                onClick={() => setContactInfo(prev => ({ ...prev, show: false }))}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {showRatingModal && (
                    <div className="rating-modal">
                        <div className="rating-content">
                            <h3>Rate the Service Provider</h3>
                            <div className="rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`star ${star <= rating ? 'active' : ''}`}
                                        onClick={() => setRating(star)}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <div className="rating-actions">
                                <button 
                                    className="cancel-button"
                                    onClick={() => {
                                        setShowRatingModal(false);
                                        setRating(0);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="submit-rating-button"
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
        </div>
    );
};

export default ServiceDetail; 