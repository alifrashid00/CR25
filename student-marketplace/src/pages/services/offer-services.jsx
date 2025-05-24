import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { createService } from '../../services/services';
import { processImage } from '../../services/storage';
import imageCompression from 'browser-image-compression'; // Import explicitly
import './offer-services.css';

const OfferServices = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageError, setImageError] = useState(''); // Add state for image errors
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        skills: '',
        skillLevel: '',
        hourlyRate: '',
        availability: '',
        university: '',
        providerImage: null // Store File object for provider image
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Add handler for file input
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            setFormData(prev => ({
                ...prev,
                providerImage: null
            }));
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setImageError('Please upload an image file (JPEG, PNG, etc.)');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setImageError('Image size should be less than 5MB');
            return;
        }

        setImageError('');
        setFormData(prev => ({
            ...prev,
            providerImage: file
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('Please log in to offer a service');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Convert skills string to array
            const skillsArray = formData.skills.split(',').map(skill => skill.trim());

            const serviceData = {
                ...formData,
                skills: skillsArray,
                hourlyRate: Number(formData.hourlyRate),
                providerName: user.displayName || 'Anonymous',
                providerEmail: user.email,
                status: 'active'
            };

            // Process image if one was selected
            if (formData.providerImage) {
                // Compress the image first
                try {
                    const options = {
                        maxSizeMB: 0.5, // Max size in MB
                        maxWidthOrHeight: 1000, // Max width or height
                        useWebWorker: true,
                    };
                    const compressedFile = await imageCompression(formData.providerImage, options);
                    serviceData.providerImage = await processImage(compressedFile); // Store as providerImage
                } catch (compressionError) {
                    console.error('Error compressing image:', compressionError);
                    // If compression fails, try with the original
                    serviceData.providerImage = await processImage(formData.providerImage);
                }
            } else {
                serviceData.providerImage = ''; // Ensure providerImage is an empty string if no image is uploaded
            }

            const serviceToCreate = { ...serviceData };
            // Remove the File object before sending to Firestore if it's still there from direct assignment
            if (serviceToCreate.providerImage instanceof File) {
                 delete serviceToCreate.providerImage;
            }

            await createService(serviceToCreate, user.uid);
            navigate('/services');
        } catch (error) {
            console.error('Error creating service:', error);
            setError('Failed to create service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="offer-services-container">
            <div className="offer-services-content">
                <h1>Offer Your Service</h1>
                <p className="subtitle">Share your skills and expertise with the student community</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="offer-services-form">
                    <div className="form-group">
                        <label htmlFor="title">Service Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Python Programming Tutor"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your service in detail..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a category</option>
                            <option value="Tutoring">Tutoring</option>
                            <option value="Programming">Programming</option>
                            <option value="Design">Design</option>
                            <option value="Writing">Writing</option>
                            <option value="Language">Language</option>
                            <option value="Music">Music</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="skills">Skills (comma-separated)</label>
                        <input
                            type="text"
                            id="skills"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            placeholder="e.g., Python, Data Analysis, Machine Learning"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="skillLevel">Skill Level</label>
                        <select
                            id="skillLevel"
                            name="skillLevel"
                            value={formData.skillLevel}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select skill level</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="hourlyRate">Hourly Rate (৳)</label>
                        <input
                            type="number"
                            id="hourlyRate"
                            name="hourlyRate"
                            value={formData.hourlyRate}
                            onChange={handleChange}
                            placeholder="Enter your hourly rate"
                            min="0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="availability">Availability</label>
                        <select
                            id="availability"
                            name="availability"
                            value={formData.availability}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select availability</option>
                            <option value="weekdays">Weekdays</option>
                            <option value="weekends">Weekends</option>
                            <option value="evenings">Evenings</option>
                            <option value="flexible">Flexible</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="university">University</label>
                        <input
                            type="text"
                            id="university"
                            name="university"
                            value={formData.university}
                            onChange={handleChange}
                            placeholder="Enter your university"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="providerImage">Profile Image (Optional)</label>
                        <input
                            type="file"
                            id="providerImage"
                            name="providerImage"
                            onChange={handleImageUpload}
                            accept="image/*"
                        />
                        {imageError && <div className="error-message">{imageError}</div>}
                        <small>Optional. Max size: 5MB. Recommended dimensions: 500x500px</small>
                    </div>

                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? 'Creating Service...' : 'Create Service'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OfferServices;