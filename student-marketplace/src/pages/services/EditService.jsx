import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getServiceById, updateService } from '../../services/services';
import { processImage } from '../../services/storage';
import imageCompression from 'browser-image-compression';
import './services.css';
import { getUserById } from '../../services/users';
import { doc, getDoc, collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';

const EditService = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        hourlyRate: '',
        skills: '',
        skillLevel: 'beginner',
        availability: 'part-time',
        providerImage: '' // Changed from profileImage to providerImage
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [imageError, setImageError] = useState('');
    const [service, setService] = useState(null);

    useEffect(() => {
        fetchService();
    }, [id]);

    const fetchService = async () => {
        try {
            setLoading(true);
            const service = await getServiceById(id);
            
            // Check if the user owns this service
            if (service.userId !== user.uid) {
                throw new Error('You do not have permission to edit this service');
            }
            setService(service);
            setFormData({
                title: service.title,
                description: service.description,
                hourlyRate: service.hourlyRate,
                skills: service.skills.join(', '),  
                skillLevel: service.skillLevel,
                availability: service.availability,
                providerImage: '' // Changed from profileImage to providerImage
            });
        } catch (error) {
            console.error('Error fetching service:', error);
            setError(error.message || 'Failed to load service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        setImageError('');

        try {
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Image must be less than 5MB');
            }

            // Compress the image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };
            const compressedFile = await imageCompression(file, options);

            setFormData(prev => ({
                ...prev,
                providerImage: compressedFile // Changed from profileImage to providerImage
            }));
        } catch (error) {
            console.error('Error processing image:', error);
            setImageError(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('Please log in to update your service');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Convert skills string to array and clean up
            const skillsArray = formData.skills
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);

            // Process image if one was selected
            let providerImageData = service?.providerImage || ''; // Changed from profileImage to providerImage
            if (formData.providerImage instanceof File) { // Changed from profileImage to providerImage
                providerImageData = await processImage(formData.providerImage); // Changed from profileImage to providerImage
            } else if (typeof formData.providerImage === 'string' && formData.providerImage) { // Changed from profileImage to providerImage
                providerImageData = formData.providerImage; // Changed from profileImage to providerImage
            }

            const serviceData = {
                ...formData,
                skills: skillsArray,
                hourlyRate: Number(formData.hourlyRate),
                providerImage: providerImageData, // Changed from profileImage to providerImage
                updatedAt: new Date(),
                userId: user.uid // Ensure userId is included
            };

            // Remove the File or Blob object before sending to Firestore
            if (serviceData.providerImage instanceof File || serviceData.providerImage instanceof Blob) { // Changed from profileImage to providerImage
                delete serviceData.providerImage; // Changed from profileImage to providerImage
            }

            await updateService(id, serviceData);
            navigate(`/services/${id}`);
        } catch (error) {
            console.error('Error updating service:', error);
            setError(error.message || 'Failed to update service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading service...</div>;
    }

    return (
        <div className="offer-service-container">
            <h2>Edit Service</h2>
            {error && <div className="error-message">{error}</div>}
            {imageError && <div className="error-message">{imageError}</div>}

            <form onSubmit={handleSubmit} className="offer-service-form">
                <div className="form-group">
                    <label htmlFor="title">Service Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
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
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="hourlyRate">Hourly Rate (৳)</label>
                    <input
                        type="number"
                        id="hourlyRate"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        min="0"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="skills">Skills (comma-separated)</label>
                    <input
                        type="text"
                        id="skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        placeholder="e.g., Web Development, Graphic Design, Content Writing"
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
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                    </select>
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
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="weekends">Weekends Only</option>
                        <option value="flexible">Flexible Hours</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="providerImage">Profile Image</label>
                    <input
                        type="file"
                        id="providerImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="image-input"
                    />
                    <small>Leave empty to keep the current image</small>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Service'}
                </button>
            </form>
        </div>
    );
};

export default EditService;