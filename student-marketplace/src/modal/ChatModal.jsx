import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase.js';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
} from 'firebase/firestore';
import LocationSelectionModal from '../components/LocationSelectionModal.jsx';
import { getUserById } from '../services/users.js';
import { processImage, validateChatImage } from '../services/storage.js';
import './ChatModal.css'

const ChatModal = ({ conversationId, currentUserId, receiverId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [singleLocationMode, setSingleLocationMode] = useState(false);
    const [pendingLocationConfirmations, setPendingLocationConfirmations] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImagePreview, setSelectedImagePreview] = useState(null);
    const bottomRef = useRef();
    const fileInputRef = useRef();

    useEffect(() => {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [conversationId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, {
            senderId: currentUserId,
            text: newMessage,
            createdAt: serverTimestamp(),
            type: 'text'
        });

        setNewMessage('');
        scrollToBottom();
    };

    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            validateChatImage(file);
            handleImageUpload(file);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleImageUpload = async (file) => {
        setIsUploading(true);
        try {
            // Check if user is authenticated
            if (!currentUserId) {
                throw new Error('You must be logged in to send images');
            }

            // Process the image to base64 (includes compression)
            const base64Image = await processImage(file);
            
            // Send the image message with base64 data
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            await addDoc(messagesRef, {
                senderId: currentUserId,
                imageData: base64Image,
                imageName: file.name,
                imageSize: file.size,
                imageType: file.type,
                createdAt: serverTimestamp(),
                type: 'image'
            });

            scrollToBottom();
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to process image. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleImagePreview = (imageUrl) => {
        setSelectedImagePreview(imageUrl);
    };

    const closeImagePreview = () => {
        setSelectedImagePreview(null);
    };

    const handleLocationSelect = async (locations) => {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        
        // Get the next location number by counting existing location messages
        const existingLocationCount = messages.filter(msg => msg.type === 'location').length;
        
        // Send each location as a separate message with a clickable link
        for (let i = 0; i < locations.length; i++) {
            const location = locations[i];
            const locationNumber = existingLocationCount + i + 1;
            const locationText = `📍 Location ${locationNumber}: https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}&zoom=16#map=16/${location.lat}/${location.lng}`;
            
            await addDoc(messagesRef, {
                senderId: currentUserId,
                text: locationText,
                locationData: location,
                locationNumber: locationNumber,
                createdAt: serverTimestamp(),
                type: 'location',
                status: 'pending'
            });
        }

        setShowLocationModal(false);
        scrollToBottom();
    };

    const handleLocationConfirm = async (messageId, locationData) => {
        // Update the message to confirmed status
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        await updateDoc(messageRef, {
            status: 'confirmed',
            confirmedLocation: locationData,
            confirmedBy: currentUserId,
            confirmedAt: serverTimestamp()
        });

        // Update both users' profiles with the meeting location
        await updateUserProfiles(locationData);

        // Remove from pending confirmations
        setPendingLocationConfirmations(prev => ({
            ...prev,
            [messageId]: false
        }));
    };

    const handleLocationResend = async (locationData, originalLocationNumber) => {
        // Resending a location means agreement
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const agreementText = `✅ Agreed on Location ${originalLocationNumber}: https://www.openstreetmap.org/?mlat=${locationData.lat}&mlon=${locationData.lng}&zoom=16#map=16/${locationData.lat}/${locationData.lng}`;
        
        await addDoc(messagesRef, {
            senderId: currentUserId,
            text: agreementText,
            locationData: locationData,
            locationNumber: originalLocationNumber,
            createdAt: serverTimestamp(),
            type: 'location',
            status: 'agreed',
            isAgreement: true
        });

        // Update both users' profiles with the agreed meeting location
        await updateUserProfiles(locationData);
        
        scrollToBottom();
    };

    const updateUserProfiles = async (locationData) => {
        try {
            const currentUserData = await getUserById(currentUserId);
            const receiverUserData = await getUserById(receiverId);

            if (currentUserData && receiverUserData) {
                const meetingLocationData = {
                    ...locationData,
                    agreedAt: serverTimestamp(),
                    participants: [currentUserId, receiverId]
                };

                // Update current user's profile
                const currentUserRef = doc(db, 'users', currentUserData.id);
                await updateDoc(currentUserRef, {
                    meetingLocation: meetingLocationData,
                    meetingWith: receiverId,
                    lastUpdated: serverTimestamp()
                });

                // Update receiver's profile
                const receiverUserRef = doc(db, 'users', receiverUserData.id);
                await updateDoc(receiverUserRef, {
                    meetingLocation: meetingLocationData,
                    meetingWith: currentUserId,
                    lastUpdated: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error updating user profiles:', error);
        }
    };

    // const handleLocationClick = (messageId, locationData) => {
    //     if (pendingLocationConfirmations[messageId]) return;
        
    //     setPendingLocationConfirmations(prev => ({
    //         ...prev,
    //         [messageId]: locationData
    //     }));
    // };

    const confirmLocationSelection = (messageId) => {
        const selectedLocation = pendingLocationConfirmations[messageId];
        if (selectedLocation) {
            handleLocationConfirm(messageId, selectedLocation);
        }
    };

    const cancelLocationSelection = (messageId) => {
        setPendingLocationConfirmations(prev => ({
            ...prev,
            [messageId]: false
        }));
    };

    const renderMessage = (msg) => {
        if (msg.type === 'image') {
            return (
                <div key={msg.id} className={`chat-message image-message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
                    <div className="image-message-content">
                        <img 
                            src={msg.imageData} 
                            alt={msg.imageName || 'Shared image'}
                            className="chat-image-thumbnail"
                            onClick={() => handleImagePreview(msg.imageData)}
                            onError={(e) => {
                                e.target.src = '/default-service.jpg'; // fallback image
                                e.target.alt = 'Failed to load image';
                            }}
                        />
                        {msg.imageName && (
                            <div className="image-name">{msg.imageName}</div>
                        )}
                        {msg.imageSize && (
                            <div className="image-info">
                                {(msg.imageSize / 1024).toFixed(1)} KB
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (msg.type === 'location') {
            const isConfirmed = msg.status === 'confirmed';
            const isAgreed = msg.status === 'agreed' || msg.isAgreement;
            const canInteract = msg.senderId !== currentUserId && !isConfirmed && !isAgreed;
            const isPending = pendingLocationConfirmations[msg.id];
            
            // Check if the message contains a proper URL
            const hasValidUrl = msg.text && msg.text.includes('https://');

            return (
                <div key={msg.id} className={`chat-message location-message ${msg.senderId === currentUserId ? 'sent' : 'received'} ${isAgreed ? 'agreed' : ''}`}>
                    <div className="location-message-content">
                        <div className="location-text">
                            {hasValidUrl ? (
                                <>
                                    {msg.text.split('https://')[0]}
                                    <a 
                                        href={msg.text.substring(msg.text.indexOf('https://'))} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="location-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        View on Map 🗺️
                                    </a>
                                </>
                            ) : (
                                <span>{msg.text || 'Location shared'}</span>
                            )}
                        </div>
                        
                        {isConfirmed && (
                            <div className="confirmed-status">
                                <span className="confirmed-badge">✅ Meeting Place Confirmed</span>
                            </div>
                        )}

                        {isAgreed && (
                            <div className="agreed-status">
                                <span className="agreed-badge">🤝 Meeting Location Agreed!</span>
                            </div>
                        )}

                        {canInteract && !isPending && (
                            <div className="location-actions">
                                <button 
                                    className="resend-location-btn"
                                    onClick={() => handleLocationResend(msg.locationData, msg.locationNumber)}
                                    title="Agree to this location"
                                >
                                    🤝 Agree to Location {msg.locationNumber}
                                </button>
                                <button 
                                    className="counter-proposal-btn"
                                    onClick={() => {
                                        setSingleLocationMode(true);
                                        setShowLocationModal(true);
                                    }}
                                    title="Send a counter-proposal location"
                                >
                                    📍 Send Counter-Proposal
                                </button>
                            </div>
                        )}

                        {isPending && (
                            <div className="location-confirmation">
                                <p>Confirm this as your meeting location?</p>
                                <div className="confirmation-buttons">
                                    <button 
                                        className="confirm-btn"
                                        onClick={() => confirmLocationSelection(msg.id)}
                                    >
                                        Confirm
                                    </button>
                                    <button 
                                        className="cancel-btn"
                                        onClick={() => cancelLocationSelection(msg.id)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div key={msg.id} className={`chat-message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
                {msg.text}
            </div>
        );
    };

        return (
        <div className="chat-modal-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="chat-close-button" onClick={onClose}>✕</button>
                <div className="chat-messages">
                    {messages.map((msg) => renderMessage(msg))}
                    <div ref={bottomRef}/>
                </div>
                <div className="chat-input-container">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isUploading}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <button 
                        className="image-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        title="Send image"
                    >
                        {isUploading ? '⏳' : '📷'}
                    </button>
                    <button 
                        className="location-btn"
                        onClick={() => {
                            setSingleLocationMode(false);
                            setShowLocationModal(true);
                        }}
                        title="Share location"
                        disabled={isUploading}
                    >
                        📍
                    </button>
                    <button onClick={handleSend} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Send'}
                    </button>
                </div>
            </div>

            {showLocationModal && (
                <LocationSelectionModal
                    onClose={() => {
                        setShowLocationModal(false);
                        setSingleLocationMode(false);
                    }}
                    onLocationsSelect={handleLocationSelect}
                    singleLocationMode={singleLocationMode}
                />
            )}

            {selectedImagePreview && (
                <div className="image-preview-overlay" onClick={closeImagePreview}>
                    <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
                        <button className="image-preview-close" onClick={closeImagePreview}>✕</button>
                        <img 
                            src={selectedImagePreview} 
                            alt="Full size preview" 
                            className="image-preview-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatModal;
