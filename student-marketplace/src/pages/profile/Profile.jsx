import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
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
        profilePic: ''
    });
    const [previewPic, setPreviewPic] = useState(null);
    const [originalData, setOriginalData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        studentId: '',
        dateOfBirth: '',
        profilePic: ''
    });
    const [originalPreviewPic, setOriginalPreviewPic] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.email) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.email));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const newData = {
                            firstName: userData.firstName || '',
                            lastName: userData.lastName || '',
                            phoneNumber: userData.phoneNumber || '',
                            studentId: userData.studentId || '',
                            dateOfBirth: userData.dateOfBirth || '',
                            profilePic: userData.profilePic || ''
                        };
                        setFormData(newData);
                        setOriginalData(newData);
                        setPreviewPic(userData.profilePic || null);
                        setOriginalPreviewPic(userData.profilePic || null);
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
        setPreviewPic(originalPreviewPic);
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
            <div className="profile-header">
                <h2>Profile</h2>
                {!isEditing && (
                    <button onClick={handleEdit} className="edit-button">
                        Edit Profile
                    </button>
                )}
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
        </div>
    );
}

export default Profile;