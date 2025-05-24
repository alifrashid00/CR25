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
        await addDoc(messagesRef, {
            senderId: currentUserId,
            text: `Shared ${locations.length} potential meeting locations`,
            locations: locations,
            createdAt: serverTimestamp(),
            type: 'location',
            status: 'pending'
        });

        setShowLocationModal(false);
        scrollToBottom();
    };

    const handleLocationConfirm = async (messageId, selectedLocation) => {
        // Update the message to confirmed status
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        await updateDoc(messageRef, {
            status: 'confirmed',
            confirmedLocation: selectedLocation,
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
                    meetingLocation: selectedLocation,
                    meetingWith: receiverId,
                    lastUpdated: serverTimestamp()
                });

                // Update receiver's profile
                const receiverUserRef = doc(db, 'users', receiverUserData.id);
                await updateDoc(receiverUserRef, {
                    meetingLocation: selectedLocation,
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

    const handleLocationClick = (messageId, location) => {
        if (pendingLocationConfirmations[messageId]) return;
        
        setPendingLocationConfirmations(prev => ({
            ...prev,
            [messageId]: location
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
            return (
                <div key={msg.id} className={`chat-message location-message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
                    <div className="location-message-header">
                        <span className="location-icon">📍</span>
                        <span>{msg.text}</span>
                        {msg.status === 'confirmed' && (
                            <span className="confirmed-badge">✅ Confirmed</span>
                        )}
                    </div>
                    
                    {msg.locations && msg.locations.map((location, index) => (
                        <div key={index} className="location-item">
                            <div 
                                className={`location-pin ${pendingLocationConfirmations[msg.id] === location ? 'selected' : ''} ${msg.status === 'confirmed' && msg.confirmedLocation === location ? 'confirmed' : ''}`}
                                onClick={() => msg.senderId !== currentUserId && msg.status !== 'confirmed' && handleLocationClick(msg.id, location)}
                            >
                                <span className="pin-icon">📍</span>
                                <span className="location-coords">
                                    Location {index + 1}: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                </span>
                                {msg.status === 'confirmed' && msg.confirmedLocation === location && (
                                    <span className="meeting-place-badge">🏢 Meeting Place</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {pendingLocationConfirmations[msg.id] && (
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
            );
        }

        return (
            <div key={msg.id} className={`chat-message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
                {msg.text}
            </div>
        );
    };

        return (
        <div className="chat-modal-overlay">
            <div className="chat-modal-container">
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
