import React, { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import {
    collection,
    doc,
    getDoc,
    setDoc,
    addDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";
import "./ChatModal.css";
import LocationSelectionModal from "../components/LocationSelectionModal";

// Deterministic conversation ID
const getConversationId = (buyerId, sellerId, listingId) =>
    [buyerId, sellerId, listingId].sort().join("_");

export default function ChatModal({ listing, currentUser, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [conversationId, setConversationId] = useState(null);
    const [sellerInfo, setSellerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const messagesEndRef = useRef(null);

    // Improved scroll behavior with debounce
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (!currentUser?.id || !listing?.id || !listing?.userId) return;

        const cid = getConversationId(currentUser.id, listing.userId, listing.id);
        setConversationId(cid);

        const initConversation = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load seller info first
                const sellerRef = doc(db, "users", listing.userId);
                const sellerSnap = await getDoc(sellerRef);
                if (sellerSnap.exists()) {
                    setSellerInfo(sellerSnap.data());
                }

                // Initialize or get conversation
                const convoRef = doc(db, "conversations", cid);
                const convoSnap = await getDoc(convoRef);

                if (!convoSnap.exists()) {
                    await setDoc(convoRef, {
                        listingId: listing.id,
                        buyerId: currentUser.id,
                        sellerId: listing.userId,
                        listingTitle: listing.title,
                        listingImage: listing.images?.[0] || "",
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        lastMessage: "",
                    });
                }

                // Set up real-time message listener
                const messagesQuery = query(
                    collection(db, "messages"),
                    where("conversationId", "==", cid),
                    orderBy("timestamp", "asc")
                );

                const unsubscribe = onSnapshot(
                    messagesQuery,
                    (snapshot) => {
                        const msgs = snapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                            // Convert Firestore timestamp to Date if it exists
                            timestamp: doc.data().timestamp?.toDate?.() || null,
                        }));
                        setMessages(msgs);
                        setLoading(false);
                    },
                    (err) => {
                        console.error("Message listener error:", err);
                        setError("Failed to load messages. Please try again.");
                        setLoading(false);
                    }
                );

                return () => unsubscribe(); // Cleanup on unmount
            } catch (e) {
                console.error("Failed to load chat:", e);
                setError("Failed to initialize chat. Please try again.");
                setLoading(false);
            }
        };

        initConversation();

        return () => {
            // Cleanup when component unmounts
            setMessages([]);
            setLoading(true);
        };
    }, [listing, currentUser]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !conversationId) return;

        try {
            setNewMessage(""); // Optimistic update

            // Add new message
            await addDoc(collection(db, "messages"), {
                conversationId,
                senderId: currentUser.id,
                content: newMessage.trim(),
                timestamp: serverTimestamp(),
                read: false,
            });

            // Update conversation
            await updateDoc(doc(db, "conversations", conversationId), {
                lastMessage: newMessage.trim(),
                updatedAt: serverTimestamp(),
            });

        } catch (err) {
            console.error("Send failed:", err);
            setError("Failed to send message. Please try again.");
            setNewMessage(newMessage); // Revert if failed
        }
    };

    const handleLocationsSelect = async (locations) => {
        try {
            const locationMessage = `📍 Suggested meeting locations:\n${locations.map((loc, index) => 
                `${index + 1}. ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`
            ).join('\n')}`;
            
            // Add location message
            await addDoc(collection(db, "messages"), {
                conversationId,
                senderId: currentUser.id,
                content: locationMessage,
                locations: locations,
                timestamp: serverTimestamp(),
                read: false,
                type: 'locations'
            });

            // Update conversation
            await updateDoc(doc(db, "conversations", conversationId), {
                lastMessage: locationMessage,
                updatedAt: serverTimestamp(),
            });

            setShowLocationModal(false);
        } catch (err) {
            console.error("Failed to send locations:", err);
            setError("Failed to share locations. Please try again.");
        }
    };

    const handleLocationAgree = async (messageId, locationIndex) => {
        try {
            const messageRef = doc(db, "messages", messageId);
            const messageDoc = await getDoc(messageRef);
            
            if (!messageDoc.exists()) return;

            const messageData = messageDoc.data();
            const locations = messageData.locations || [];
            
            if (locationIndex >= 0 && locationIndex < locations.length) {
                await updateDoc(messageRef, {
                    agreedLocation: locations[locationIndex],
                    agreedBy: currentUser.id,
                    agreedAt: serverTimestamp()
                });

                // Update the listing with the agreed location
                if (listing?.id) {
                    await updateDoc(doc(db, "listings", listing.id), {
                        meetingLocation: locations[locationIndex],
                        meetingLocationAgreedBy: [currentUser.id, messageData.senderId],
                        meetingLocationAgreedAt: serverTimestamp()
                    });
                }
            }
        } catch (err) {
            console.error("Failed to agree to location:", err);
            setError("Failed to confirm location. Please try again.");
        }
    };

    return (
        <div className="chat-modal-overlay">
            <div className="chat-modal">
                <div className="chat-header">
                    <div className="chat-seller">
                        <img
                            src={
                                sellerInfo?.profilePic
                                    ? sellerInfo.profilePic
                                    : "/default-avatar.png"
                            }
                            alt={`${sellerInfo?.firstName || "Seller"} ${sellerInfo?.lastName || ""}`}
                            className="chat-avatar"
                        />
                        <div>
                            <h4>{`${sellerInfo?.firstName || "Seller"} ${sellerInfo?.lastName || ""}`}</h4>
                            <small>About: {listing?.title}</small>
                        </div>
                    </div>
                    <button className="chat-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="chat-body">
                    {error ? (
                        <p className="error-message">{error}</p>
                    ) : loading ? (
                        <div className="loading-spinner">Loading...</div>
                    ) : messages.length === 0 ? (
                        <p className="empty-chat">Start your conversation about {listing.title}</p>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`chat-message ${msg.senderId === currentUser.id ? "sent" : "received"}`}
                            >
                                <p>{msg.content}</p>
                                {msg.type === 'locations' && (
                                    <div className="locations-message">
                                        {msg.locations.map((loc, index) => (
                                            <div key={index} className="location-item">
                                                <a
                                                    href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=15/${loc.lat}/${loc.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="view-location-link"
                                                >
                                                    View Location {index + 1} on Map
                                                </a>
                                                {!msg.agreedLocation && msg.senderId !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleLocationAgree(msg.id, index)}
                                                        className="agree-location-btn"
                                                    >
                                                        Agree to Meet Here
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {msg.agreedLocation && (
                                            <div className="location-agreed">
                                                <strong>Agreed Meeting Location:</strong>
                                                <a
                                                    href={`https://www.openstreetmap.org/?mlat=${msg.agreedLocation.lat}&mlon=${msg.agreedLocation.lng}#map=15/${msg.agreedLocation.lat}/${msg.agreedLocation.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="view-location-link"
                                                >
                                                    View Agreed Location on Map
                                                </a>
                                                <span>
                                                    {msg.agreedBy === currentUser.id ? 'You agreed' : 'Other party agreed'} to meet here
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <small>
                                    {msg.timestamp?.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }) || "Just now"}
                                </small>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef}/>
                </div>

                <div className="chat-input">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        disabled={loading}
                    />
                    <button
                        className="location-btn"
                        onClick={() => setShowLocationModal(true)}
                        title="Share Locations"
                    >
                        📍
                    </button>
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || loading}
                    >
                        {loading ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>

            {showLocationModal && (
                <LocationSelectionModal
                    onClose={() => setShowLocationModal(false)}
                    onLocationsSelect={handleLocationsSelect}
                />
            )}
        </div>
    );
}