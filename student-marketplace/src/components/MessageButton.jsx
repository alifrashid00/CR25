import React, { useState } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import ChatModal from "../modal/ChatModal.jsx";
import './MessageButton.css'

const MessageButton = ({ listing, service, currentUser }) => {
    const [conversationId, setConversationId] = useState(null);
    const [showChat, setShowChat] = useState(false);

    // Determine the item details based on whether it's a listing or service
    const item = listing || service;
    const itemType = listing ? 'listing' : 'service';
    const itemId = item?.id;
    const providerId = listing ? listing.userId : service?.userId; // Services use userId, not providerId
    const buttonText = listing ? 'Chat with Seller' : 'Chat with Provider';

    const handleChatClick = async () => {
        if (!currentUser || !item) {
            console.warn('MessageButton: Missing currentUser or item data');
            return;
        }

        // Validate required fields
        if (!itemId) {
            console.error('MessageButton: Item ID is undefined');
            return;
        }
        
        if (!currentUser.id) {
            console.error('MessageButton: Current user ID is undefined');
            return;
        }
        
        if (!providerId) {
            console.error('MessageButton: Provider ID is undefined');
            return;
        }

        try {
            // Step 1: Check if conversation already exists
            const conversationField = itemType === 'listing' ? 'sellerId' : 'providerId';
            
            const q = query(
                collection(db, 'conversations'),
                where(`${itemType}Id`, '==', itemId),
                where('buyerId', '==', currentUser.id),
                where(conversationField, '==', providerId)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Existing conversation found
                setConversationId(querySnapshot.docs[0].id);
                setShowChat(true);
            } else {
                // Step 2: Create new conversation
                const conversationData = {
                    buyerId: currentUser.id,
                    lastMessage: '',
                    updatedAt: serverTimestamp(),
                };
                
                // Add the appropriate item ID and provider ID fields
                conversationData[`${itemType}Id`] = itemId;
                conversationData[conversationField] = providerId;

                const docRef = await addDoc(collection(db, 'conversations'), conversationData);

                setConversationId(docRef.id);
                setShowChat(true);
            }
        } catch (error) {
            console.error('Error initiating chat:', error);
            // Optionally show user-friendly error message
            alert('Failed to start chat. Please try again.');
        }
    };

    return (
        <>
            <button
                className="chat-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleChatClick}
            >
                {buttonText}
            </button>

            {showChat && conversationId && (
                <ChatModal
                    conversationId={conversationId}
                    currentUserId={currentUser.id}
                    receiverId={providerId}
                    onClose={() => setShowChat(false)}
                />
            )}
        </>
    );
};

export default MessageButton;
