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

const MessageButton = ({ listing, currentUser }) => {
    const [conversationId, setConversationId] = useState(null);
    const [showChat, setShowChat] = useState(false);

    const handleChatClick = async () => {
        if (!currentUser || !listing) return;

        try {
            // Step 1: Check if conversation already exists
            const q = query(
                collection(db, 'conversations'),
                where('listingId', '==', listing.id),
                where('buyerId', '==', currentUser.id),
                where('sellerId', '==', listing.userId)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Existing conversation found
                setConversationId(querySnapshot.docs[0].id);
                setShowChat(true);
            } else {
                // Step 2: Create new conversation
                const docRef = await addDoc(collection(db, 'conversations'), {
                    listingId: listing.id,
                    buyerId: currentUser.id,
                    sellerId: listing.userId,
                    lastMessage: '',
                    updatedAt: serverTimestamp(),
                });

                setConversationId(docRef.id);
                setShowChat(true);
            }
        } catch (error) {
            console.error('Error initiating chat:', error);
        }
    };

    return (
        <>
            <button
                className="chat-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleChatClick}
            >
                Chat with Seller
            </button>

            {showChat && conversationId && (
                <ChatModal
                    conversationId={conversationId}
                    currentUserId={currentUser.id}
                    receiverId={listing.userId}
                    onClose={() => setShowChat(false)}
                />
            )}
        </>
    );
};

export default MessageButton;
