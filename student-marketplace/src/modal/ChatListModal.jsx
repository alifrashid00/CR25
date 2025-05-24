import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import ChatModal from "./ChatModal.jsx";
import './ChatListModal.css'

const ChatListModal = ({ listing, sellerId, onClose }) => {
    console.log("ChatListModal props:", { listing, sellerId });
    const [buyers, setBuyers] = useState([]);
    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
         console.log("Triggering useEffect for listing.id:", listing?.id, "sellerId:", sellerId);
        const fetchBuyers = async () => {
            console.log("Fetching conversations for:", listing.id, sellerId);
            setLoading(true);
            const q = query(
                collection(db, 'conversations'),
                where('listingId', '==', listing.id),
                where('sellerId', '==', sellerId)
            );

            const snapshot = await getDocs(q);
            console.log("Fetched conversations:", snapshot.docs.map(doc => doc.data()));
            const buyerInfo = [];

            for (const docSnap of snapshot.docs) {
                const convo = docSnap.data();
                console.log("Looking up user with ID:", convo.buyerId);

                const userQuery = query(
                    collection(db, 'users'),
                    where('uid', '==', convo.buyerId)
                );
                const userSnapshot = await getDocs(userQuery);

                if (!userSnapshot.empty) {
                    const userDoc = userSnapshot.docs[0];
                    const userData = userDoc.data();

                    buyerInfo.push({
                        id: convo.buyerId,
                        name: `${userData.firstName} ${userData.lastName}`,
                        email: userData.email,
                        conversationId: docSnap.id,
                    });
                } else {
                    console.warn("❌ No user found for buyerId:", convo.buyerId);
                }

            }


            setBuyers(buyerInfo);
            setLoading(false);
        };


        fetchBuyers();
    }, [listing.id, sellerId]);
    useEffect(() => {
        console.log('Listing ID passed to ChatListModal:', listing?.id);
    }, [listing]);

    const handleOpenChat = (buyer) => {
        setSelectedBuyer(buyer.id);
        setConversationId(buyer.conversationId);
    };

    return (
        <div className="chat-modal-overlay">
            <div className="chat-modal-container">
                <button className="chat-close-button" onClick={onClose}>✕</button>
                <h2 className="text-lg font-bold mb-2">Buyers for: {listing.title}</h2>

                {loading ? (
                    <p>Loading buyers...</p>
                ) : buyers.length === 0 ? (
                    <p>No buyers have messaged yet.</p>
                ) : (
                    <ul className="chat-list">
                        {buyers.map((buyer) => {
                            const initials = buyer.name
                                .split(' ')
                                .map((word) => word[0])
                                .join('')
                                .toUpperCase();

                            return (
                                <li
                                    key={buyer.id}
                                    className="chat-list-item"
                                    onClick={() => handleOpenChat(buyer)}
                                >
                                    {buyer.profilePic ? (
                                        <img src={buyer.profilePic} alt={buyer.name} className="chat-avatar-image" />
                                    ) : (
                                        <div className="chat-avatar">{initials}</div>
                                    )}
                                    <div className="chat-content">
                                        <div className="chat-header">
                                            <span className="chat-name">{buyer.name}</span>
                                            <span className="chat-time">4:30 PM</span>
                                        </div>
                                        <div className="chat-message">Click to open chat</div>
                                    </div>
                                    {/* Optionally add unread badge */}
                                    {/* <div className="chat-badge">2</div> */}
                                </li>
                            );
                        })}
                    </ul>

                )}

                {conversationId && selectedBuyer && (
                    <ChatModal
                        conversationId={conversationId}
                        currentUserId={sellerId}
                        receiverId={selectedBuyer}
                        onClose={() => {
                            setConversationId(null);
                            setSelectedBuyer(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default ChatListModal;
