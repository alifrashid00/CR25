import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getListingById, updateListing } from '../../services/listings';
import { processMultipleImages } from '../../services/storage';
import imageCompression from 'browser-image-compression';
import './listing.css';

const EditListing = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        condition: 'new',
        images: [],
        visibility: 'university',
        pricingType: 'fixed',
        university: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [imageErrors, setImageErrors] = useState([]);

    const categories = [
        'Textbooks',
        'Electronics',
        'Furniture',
        'Clothing',
        'Sports Equipment',
        'Musical Instruments',
        'Other'
    ];

    useEffect(() => {
        fetchListing();
    }, [id]);

    const fetchListing = async () => {
        try {
            setLoading(true);
            const listing = await getListingById(id);
            
            // Check if the user owns this listing
            if (listing.userId !== user.uid) {
                throw new Error('You do not have permission to edit this listing');
            }

            setFormData({
                title: listing.title,
                description: listing.description,
                price: listing.price || '',
                category: listing.category,
                condition: listing.condition,
                images: listing.images,
                visibility: listing.visibility,
                pricingType: listing.pricingType,
                university: listing.university
            });
        } catch (error) {
            console.error('Error fetching listing:', error);
            setError(error.message || 'Failed to load listing. Please try again.');
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
        const files = Array.from(e.target.files);
        setImageErrors([]);

        try {
            // Validate images
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error('Each image must be less than 5MB');
                }
            }

            // Compress images
            const compressedFiles = await Promise.all(
                files.map(file => imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                }))
            );

            // Process images
            const base64Images = await processMultipleImages(compressedFiles);
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...base64Images]
            }));
        } catch (error) {
            console.error('Error processing images:', error);
            setImageErrors([error.message]);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('Please log in to update your listing');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Process any new images if they were added
            let processedImages = [...formData.images];
            if (formData.newImages && formData.newImages.length > 0) {
                const newProcessedImages = await processMultipleImages(formData.newImages);
                processedImages = [...processedImages, ...newProcessedImages];
            }

            const listingData = {
                ...formData,
                images: processedImages,
                price: formData.pricingType === 'fixed' ? Number(formData.price) : null,
                updatedAt: new Date(),
                userId: user.uid // Ensure userId is included
            };

            // Remove any temporary fields
            delete listingData.newImages;

            await updateListing(id, listingData);
            navigate(`/listing/${id}`);
        } catch (error) {
            console.error('Error updating listing:', error);
            setError(error.message || 'Failed to update listing. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading listing...</div>;
    }

    return (
        <div className="sell-container">
            <h2>Edit Listing</h2>
            {error && <div className="error-message">{error}</div>}
            {imageErrors.length > 0 && (
                <div className="error-message">
                    {imageErrors.map((error, index) => (
                        <p key={index}>{error}</p>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="sell-form">
                <div className="form-group">
                    <label htmlFor="title">Title</label>
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
                    <label htmlFor="category">Category</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="condition">Condition</label>
                    <select
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        required
                    >
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="pricingType">Pricing Type</label>
                    <select
                        id="pricingType"
                        name="pricingType"
                        value={formData.pricingType}
                        onChange={handleChange}
                        required
                    >
                        <option value="fixed">Fixed Price</option>
                        <option value="negotiable">Negotiable</option>
                        <option value="bidding">Open to Bids</option>
                    </select>
                </div>

                {formData.pricingType === 'fixed' && (
                    <div className="form-group">
                        <label htmlFor="price">Price (৳)</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            min="0"
                            required
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="visibility">Visibility</label>
                    <select
                        id="visibility"
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleChange}
                        required
                    >
                        <option value="university">University Only</option>
                        <option value="all">All Users</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Images</label>
                    <div className="image-preview-grid">
                        {formData.images.map((image, index) => (
                            <div key={index} className="image-preview">
                                <img src={image} alt={`Preview ${index + 1}`} />
                                <button
                                    type="button"
                                    className="remove-image"
                                    onClick={() => removeImage(index)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="image-input"
                    />
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Listing'}
                </button>
            </form>
        </div>
    );
};

export default EditListing; 