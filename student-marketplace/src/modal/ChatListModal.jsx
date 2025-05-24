import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import ChatModal from "./ChatModal.jsx";

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
                    <ul className="space-y-2">
                        {buyers.map((buyer) => (
                            <li
                                key={buyer.id}
                                className="cursor-pointer hover:bg-gray-100 p-2 rounded border"
                                onClick={() => handleOpenChat(buyer)}
                            >
                                <p className="font-medium">{buyer.name}</p>
                                <p className="text-sm text-gray-600">{buyer.email}</p>
                            </li>
                        ))}
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
