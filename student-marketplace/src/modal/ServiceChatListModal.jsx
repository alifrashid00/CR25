import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { getUsersByIds } from '../services/users';
import ChatModal from "./ChatModal.jsx";
import './ChatListModal.css'

const ServiceChatListModal = ({ service, providerId, onClose }) => {
    console.log("ServiceChatListModal props:", { service, providerId });
    const [buyers, setBuyers] = useState([]);
    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Triggering useEffect for service.id:", service?.id, "providerId:", providerId);
        const fetchBuyers = async () => {
            console.log("Fetching conversations for service:", service.id, providerId);
            setLoading(true);
            const q = query(
                collection(db, 'conversations'),
                where('serviceId', '==', service.id),
                where('providerId', '==', providerId)
            );

            const snapshot = await getDocs(q);
            console.log("Fetched service conversations:", snapshot.docs.map(doc => doc.data()));
            
            if (snapshot.empty) {
                setBuyers([]);
                setLoading(false);
                return;
            }

            // Extract unique buyer IDs
            const buyerIds = [...new Set(snapshot.docs.map(doc => doc.data().buyerId))];
            
            // Batch fetch user data
            const usersMap = await getUsersByIds(buyerIds);
            
            const buyerInfo = snapshot.docs.map(docSnap => {
                const convo = docSnap.data();
                const user = usersMap.get(convo.buyerId);
                
                if (user) {
                    return {
                        id: convo.buyerId,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.email,
                        conversationId: docSnap.id,
                    };
                } else {
                    console.warn("❌ No user found for buyerId:", convo.buyerId);
                    return null;
                }
            }).filter(Boolean);

            setBuyers(buyerInfo);
            setLoading(false);
        };

        fetchBuyers();
    }, [service.id, providerId]);

    useEffect(() => {
        console.log('Service ID passed to ServiceChatListModal:', service?.id);
    }, [service]);

    const handleOpenChat = (buyer) => {
        setSelectedBuyer(buyer.id);
        setConversationId(buyer.conversationId);
    };

    return (
        <div className="chat-modal-overlay">
            <div className="chat-modal-container">
                <button className="chat-close-button" onClick={onClose}>✕</button>
                <h2 className="text-lg font-bold mb-2">Clients for: {service.title}</h2>

                {loading ? (
                    <p>Loading clients...</p>
                ) : buyers.length === 0 ? (
                    <p>No clients have messaged yet about this service.</p>
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
                        currentUserId={providerId}
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

export default ServiceChatListModal;
