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
import './ChatModal.css'

const ChatModal = ({ conversationId, currentUserId, receiverId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [pendingLocationConfirmations, setPendingLocationConfirmations] = useState({});
    const bottomRef = useRef();

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

    const handleLocationSelect = async (locations) => {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        
        // Send each location as a separate message with a clickable link
        for (let i = 0; i < locations.length; i++) {
            const location = locations[i];
            const locationText = `📍 Location ${i + 1}: https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}&zoom=16#map=16/${location.lat}/${location.lng}`;
            
            await addDoc(messagesRef, {
                senderId: currentUserId,
                text: locationText,
                locationData: location,
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
        try {
            const currentUserData = await getUserById(currentUserId);
            const receiverUserData = await getUserById(receiverId);

            if (currentUserData && receiverUserData) {
                // Update current user's profile
                const currentUserRef = doc(db, 'users', currentUserData.id);
                await updateDoc(currentUserRef, {
                    meetingLocation: locationData,
                    meetingWith: receiverId,
                    lastUpdated: serverTimestamp()
                });

                // Update receiver's profile
                const receiverUserRef = doc(db, 'users', receiverUserData.id);
                await updateDoc(receiverUserRef, {
                    meetingLocation: locationData,
                    meetingWith: currentUserId,
                    lastUpdated: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error updating user profiles:', error);
        }

        // Remove from pending confirmations
        setPendingLocationConfirmations(prev => ({
            ...prev,
            [messageId]: false
        }));
    };

    const handleLocationClick = (messageId, locationData) => {
        if (pendingLocationConfirmations[messageId]) return;
        
        setPendingLocationConfirmations(prev => ({
            ...prev,
            [messageId]: locationData
        }));
    };

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
        if (msg.type === 'location') {
            const isConfirmed = msg.status === 'confirmed';
            const canConfirm = msg.senderId !== currentUserId && !isConfirmed;
            const isPending = pendingLocationConfirmations[msg.id];
            
            // Check if the message contains a proper URL
            const hasValidUrl = msg.text && msg.text.includes('https://');

            return (
                <div key={msg.id} className={`chat-message location-message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
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

                        {canConfirm && !isPending && (
                            <div className="location-actions">
                                <button 
                                    className="confirm-location-btn"
                                    onClick={() => handleLocationClick(msg.id, msg.locationData)}
                                >
                                    📍 Set as Meeting Place
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
                    />
                    <button 
                        className="location-btn"
                        onClick={() => setShowLocationModal(true)}
                        title="Share location"
                    >
                        📍
                    </button>
                    <button onClick={handleSend}>Send</button>
                </div>
            </div>

            {showLocationModal && (
                <LocationSelectionModal
                    onClose={() => setShowLocationModal(false)}
                    onLocationsSelect={handleLocationSelect}
                />
            )}
        </div>
    );
};

export default ChatModal;
