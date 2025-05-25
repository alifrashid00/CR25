import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { createListing } from '../../services/listings';
import { processMultipleImages, validateImage } from '../../services/storage';
import Estimator from '../../components/Estimator';
import imageCompression from 'browser-image-compression'; // Import the library
import './sell.css';

const Sell = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        condition: 'new',
        images: [],
        visibility: 'university', // 'university' or 'all'
        pricingType: 'fixed', // 'fixed', 'bidding', or 'negotiable'
        university: user?.university || ''
    });
    const [loading, setLoading] = useState(false);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const errors = [];
        const validFiles = [];

        files.forEach((file, index) => {
            try {
                validateImage(file);
                validFiles.push(file);
            } catch (error) {
                errors.push(`Image ${index + 1}: ${error.message}`);
            }
        });

        if (errors.length > 0) {
            setImageErrors(errors);
        } else {
            setImageErrors([]);
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...validFiles]
            }));
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
        setLoading(true);
        setError('');

        try {
            if (!user) {
                throw new Error('You must be logged in to create a listing');
            }

            // Images are now optional - removed the check for formData.images.length === 0

            // Compress images before processing (only if there are images)
            let base64Images = [];
            if (formData.images.length > 0) {
                // Compress images before processing
                const compressedImages = await Promise.all(
                    formData.images.map(async (imageFile) => {
                        const options = {
                            maxSizeMB: 0.5, // Max size in MB (e.g., 0.5MB)
                            maxWidthOrHeight: 1920, // Max width or height
                            useWebWorker: true,
                        };
                        try {
                            const compressedFile = await imageCompression(imageFile, options);
                            return compressedFile;
                        } catch (compressionError) {
                            console.error('Error compressing image:', compressionError);
                            // Optionally, you could decide to upload the original if compression fails,
                            // or skip this image, or show an error to the user.
                            // For now, we'll try to upload the original if compression fails.
                            return imageFile; 
                        }
                    })
                );

                // Process images to base64
                base64Images = await processMultipleImages(compressedImages);
            }

            // Create listing data
            const listingData = {
                ...formData,
                images: base64Images,
                price: formData.pricingType === 'fixed' ? Number(formData.price) : null,
                userId: user.uid,
                sellerName: user.displayName,
                sellerEmail: user.email,
                sellerRating: 0,
                totalRatings: 0
            };

            // Create the listing in Firestore
            const newListing = await createListing(listingData, user.uid);
            
            // Redirect to the new listing
            navigate(`/listing`);
        } catch (error) {
            console.error('Error creating listing:', error);
            setError(error.message || 'Failed to create listing. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEstimate = (estimation) => {
        setFormData(prev => ({
            ...prev,
            condition: estimation.condition.toLowerCase(),
            price: estimation.price.toString()
        }));
    };

    return (
        <div className="sell-container">
            <h1>Create New Listing</h1>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="listing-form">
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="What are you selling?"
                        maxLength={100}
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
                        placeholder="Describe your item in detail..."
                        rows="4"
                        maxLength={1000}
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
                            <option key={category} value={category}>{category}</option>
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
                        <option value="bidding">Open to Bids</option>
                        <option value="negotiable">Negotiable</option>
                    </select>
                </div>

                {formData.pricingType === 'fixed' && (
                    <div className="form-group">
                        <label htmlFor="price">Price (BDT)</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Enter price"
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
                        <option value="university">My University Only</option>
                        <option value="all">All Universities</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="images">Images</label>
                    <input
                        type="file"
                        id="images"
                        name="images"
                        onChange={handleImageUpload}
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        required
                    />
                    {imageErrors.length > 0 && (
                        <div className="error-message">
                            {imageErrors.map((error, index) => (
                                <p key={index}>{error}</p>
                            ))}
                        </div>
                    )}
                    <div className="image-preview">
                        {formData.images.map((image, index) => (
                            <div key={index} className="preview-container">
                                <img
                                    src={URL.createObjectURL(image)}
                                    alt={`Preview ${index + 1}`}
                                    className="preview-image"
                                />
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
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Creating Listing...' : 'Create Listing'}
                </button>
            </form>
            <Estimator
                title={formData.title}
                description={formData.description}
                images={formData.images}
                onEstimate={handleEstimate}
            />
        </div>
    );
};

export default Sell;