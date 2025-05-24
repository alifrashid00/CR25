import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getSellerReviews } from '../../services/reviews';
import './profile.css'

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        studentId: '',
        dateOfBirth: '',
        profilePic: '',
        department: '',
        program: '',
        yearOfStudy: '',
        rating: 0,
        totalRatings: 0
    });
    const [reviews, setReviews] = useState([]);
    const [previewPic, setPreviewPic] = useState(null);
    const [originalData, setOriginalData] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.uid) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setFormData(userData);
                        setOriginalData(userData);
                        if (userData.profilePic) {
                            setPreviewPic(userData.profilePic);
                        }
                        
                        // Fetch seller reviews
                        const sellerReviews = await getSellerReviews(user.uid);
                        setReviews(sellerReviews);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setError('Failed to load profile data');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfilePicChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                resizeImage(reader.result, 200, 200, (resizedImage) => {
                    setPreviewPic(resizedImage);
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                resizeImage(reader.result, 200, 200, (resizedImage) => {
                    setPreviewPic(resizedImage);
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const resizeImage = (base64Str, maxWidth, maxHeight, callback) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const scaleFactor = Math.min(maxWidth / width, maxHeight / height);
                width *= scaleFactor;
                height *= scaleFactor;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            try {
                const webpData = canvas.toDataURL("image/webp", 1.0);
                if (webpData.length < 1024 * 1024) {
                    callback(webpData);
                } else {
                    callback(canvas.toDataURL("image/png"));
                }
            } catch (error) {
                callback(canvas.toDataURL("image/png"));
            }
        };
    };

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setFormData(originalData);
        setPreviewPic(originalData?.profilePic || null);
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (!user?.email) {
                throw new Error('You must be logged in to update your profile');
            }

            const updateData = {
                ...formData,
                profilePic: previewPic || formData.profilePic,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(doc(db, "users", user.email), updateData);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
        }
    };

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    return (
        <div className="profile-container">
            <h1>Profile</h1>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="profile-header">
                <div className="profile-image-container">
                    {previewPic ? (
                        <img src={previewPic} alt="Profile" className="profile-image" />
                    ) : (
                        <div className="profile-image-placeholder">
                            {formData.firstName?.[0]}{formData.lastName?.[0]}
                        </div>
                    )}
                </div>
                <div className="profile-info">
                    <h2>{formData.firstName} {formData.lastName}</h2>
                    <div className="seller-rating">
                        <span className="stars">★</span>
                        <span className="rating-value">
                            {formData.rating ? formData.rating.toFixed(1) : 'New'}
                        </span>
                        {formData.totalRatings > 0 && (
                            <span className="total-ratings">
                                ({formData.totalRatings} {formData.totalRatings === 1 ? 'rating' : 'ratings'})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group profile-pic-container">
                    <label htmlFor="profilePic">Profile Picture</label>
                    <div 
                        className="profile-pic-dropzone"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {previewPic ? (
                            <img src={previewPic} alt="Profile preview" className="profile-preview" />
                        ) : (
                            <div className="upload-placeholder">
                                {isEditing ? 'Drag & drop an image here or click to select' : 'No profile picture'}
                            </div>
                        )}
                        {isEditing && (
                            <input
                                type="file"
                                id="profilePic"
                                accept="image/*"
                                onChange={handleProfilePicChange}
                                className="profile-pic-input"
                            />
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="studentId">Student ID</label>
                    <input
                        type="text"
                        id="studentId"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth</label>
                    <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                        type="text"
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g., Computer Science and Engineering"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="program">Program</label>
                    <input
                        type="text"
                        id="program"
                        name="program"
                        value={formData.program}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g., BSc in Computer Science"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="yearOfStudy">Year of Study</label>
                    <select
                        id="yearOfStudy"
                        name="yearOfStudy"
                        value={formData.yearOfStudy}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                    >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year</option>
                    </select>
                </div>

                {isEditing && (
                    <div className="button-group">
                        <button type="submit" className="submit-button">
                            Update Profile
                        </button>
                        <button type="button" onClick={handleCancel} className="cancel-button">
                            Cancel
                        </button>
                    </div>
                )}
            </form>

            {reviews.length > 0 && (
                <div className="reviews-section">
                    <h3>Recent Reviews</h3>
                    <div className="reviews-list">
                        {reviews.slice(0, 3).map(review => (
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
                </div>
            )}
        </div>
    );
}

export default Profile;