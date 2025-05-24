import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import imageCompression from 'browser-image-compression';

// Compress image before converting to base64
const compressImage = async (file) => {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error('Error compressing image:', error);
        return file; // Return original file if compression fails
    }
};

// Convert file to base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// Process a single image
export const processImage = async (file) => {
    try {
        // Compress image first
        const compressedFile = await compressImage(file);
        
        // Convert to base64
        const base64String = await fileToBase64(compressedFile);
        
        return base64String;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Failed to process image. Please try again.');
    }
};

// Process multiple images
export const processMultipleImages = async (files) => {
    try {
        const processPromises = files.map(file => processImage(file));
        const base64Strings = await Promise.all(processPromises);
        return base64Strings;
    } catch (error) {
        console.error('Error processing multiple images:', error);
        throw error;
    }
};

// Upload a single image
export const uploadImage = async (file, path) => {
    try {
        // Compress image before upload
        const compressedFile = await compressImage(file);
        
        // Create a storage reference
        const storageRef = ref(storage, path);
        
        // Upload the file
        const snapshot = await uploadBytes(storageRef, compressedFile);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        if (error.code === 'storage/unauthorized') {
            throw new Error('You are not authorized to upload images. Please make sure you are logged in.');
        } else if (error.code === 'storage/canceled') {
            throw new Error('Upload was canceled.');
        } else if (error.code === 'storage/unknown') {
            throw new Error('An unknown error occurred while uploading the image.');
        }
        throw error;
    }
};

// Upload multiple images
export const uploadMultipleImages = async (files, basePath) => {
    try {
        const uploadPromises = files.map((file, index) => {
            const path = `${basePath}/${Date.now()}_${index}_${file.name}`;
            return uploadImage(file, path);
        });

        const urls = await Promise.all(uploadPromises);
        return urls;
    } catch (error) {
        console.error('Error uploading multiple images:', error);
        throw error;
    }
};

// Generate a unique path for listing images
export const generateListingImagePath = (userId, listingId, fileName) => {
    return `listings/${userId}/${listingId}/${Date.now()}_${fileName}`;
};

// Validate image file
export const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
    }

    return true;
}; 