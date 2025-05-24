import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../profile/profile.css';
import './admin-view-profile.css';

const AdminViewProfile = () => {
    const { email } = useParams();
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
        university: '',
        department: '',
        program: '',
        yearOfStudy: '',
        ratings: 0,
        totalRatings: 0
    });
    const [originalData, setOriginalData] = useState(null);
    const [previewPic, setPreviewPic] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (email) {
                try {
                    const userDoc = await getDoc(doc(db, "users", email));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();                        const newData = {
                            firstName: userData.firstName || '',
                            lastName: userData.lastName || '',
                            phoneNumber: userData.phoneNumber || '',
                            studentId: userData.studentId || '',
                            dateOfBirth: userData.dateOfBirth || '',
                            profilePic: userData.profilePic || '',
                            university: userData.university || '',
                            department: userData.department || '',
                            program: userData.program || '',
                            yearOfStudy: userData.yearOfStudy || '',
                            ratings: Number(userData.ratings || 0),
                            totalRatings: Number(userData.totalRatings || 0)
                        };
                        setFormData(newData);
                        setOriginalData(newData);
                        setPreviewPic(userData.profilePic || null);
                    }
                } catch (err) {
                    console.error('Error fetching user data:', err);
                    setError('Failed to load user data');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserData();
    }, [email]);

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
                }            } catch (_) {
                callback(canvas.toDataURL("image/png"));
            }
        };
    };    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'ratings' || name === 'totalRatings' ? Number(value) : value
        }));
    };

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setFormData(originalData);
        setPreviewPic(originalData.profilePic);
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const updateData = {
                ...formData,
                profilePic: previewPic || formData.profilePic,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(doc(db, "users", email), updateData);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            setOriginalData(updateData);
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
            <div className="profile-header">
                <div className="profile-title">
                    <h2>Student Profile</h2>
                    <div className="profile-rating">
                        <span className="stars">★</span>
                        <span className="rating-value">
                            {formData.ratings ? formData.ratings.toFixed(1) : 'New'}
                        </span>
                        {formData.totalRatings > 0 && (
                            <span className="rating-count">
                                ({formData.totalRatings} {formData.totalRatings === 1 ? 'rating' : 'ratings'})
                            </span>
                        )}
                    </div>
                </div>
                {!isEditing ? (
                    <button onClick={handleEdit} className="edit-button">
                        Edit Profile
                    </button>
                ) : null}
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

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

                <div className="form-section">
                    <div className="form-row">
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
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={email} disabled />
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
                    </div>

                    <div className="form-row">
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
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="university">University</label>
                            <input
                                type="text"
                                id="university"
                                name="university"
                                value={formData.university}
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
                    </div>

                    <div className="form-row">
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
                    </div>

                    {isEditing && (
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="ratings">Rating (0-5)</label>
                                <input
                                    type="number"
                                    id="ratings"
                                    name="ratings"
                                    value={formData.ratings}
                                    onChange={handleChange}
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="totalRatings">Total Ratings</label>
                                <input
                                    type="number"
                                    id="totalRatings"
                                    name="totalRatings"
                                    value={formData.totalRatings}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="button-group">
                    {isEditing ? (
                        <>
                            <button type="submit" className="submit-button">
                                Update Profile
                            </button>
                            <button type="button" onClick={handleCancel} className="cancel-button">
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={() => navigate('/manage-students')} className="back-button">
                            Back to Students
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AdminViewProfile;
