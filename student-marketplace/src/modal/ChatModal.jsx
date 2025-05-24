import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";
import "./ChatModal.css"; // Import the custom CSS


const ChatModal = ({ listing, currentUser, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [sellerData, setSellerData] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 0);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchOrCreateConversation = async () => {
            try {
                const conversationsRef = collection(db, "conversations");
                const q = query(
                    conversationsRef,
                    where("listingId", "==", listing.id),
                    where("buyerId", "==", currentUser.id),
                    where("sellerId", "==", listing.sellerId)
                );

                const sellerRef = doc(db, "users", listing.sellerId);
                const sellerSnap = await getDoc(sellerRef);
                if (sellerSnap.exists()) {
                    setSellerData(sellerSnap.data());
                }

                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const conversationDoc = querySnapshot.docs[0];
                    setConversationId(conversationDoc.id);
                    loadMessages(conversationDoc.id);
                } else {
                    const newConversation = {
                        listingId: listing.id,
                        buyerId: currentUser.id,
                        sellerId: listing.sellerId,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        listingTitle: listing.title,
                        listingImage: listing.images[0]
                    };
                    const docRef = await addDoc(conversationsRef, newConversation);
                    setConversationId(docRef.id);
                    loadMessages(docRef.id);
                }
            } catch (error) {
                console.error("Error handling conversation:", error);
                setIsLoading(false);
            }
        };

        fetchOrCreateConversation();
    }, [listing, currentUser]);

    const loadMessages = (conversationId) => {
        const messagesRef = collection(db, "messages");
        const q = query(
            messagesRef,
            where("conversationId", "==", conversationId),
            orderBy("timestamp", "asc")
        );

        return onSnapshot(q, (snapshot) => {
            const msgs = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            setMessages(msgs);
            setIsLoading(false);

            if (msgs.length > 0 && msgs[msgs.length - 1].senderId !== currentUser.id) {
                updateDoc(doc(db, "conversations", conversationId), {
                    lastRead: serverTimestamp()
                });
            }
        });
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === "" || isSending) return;

        setIsSending(true);
        try {
            await addDoc(collection(db, "messages"), {
                conversationId,
                senderId: currentUser.id,
                content: newMessage,
                timestamp: serverTimestamp(),
                read: false
            });

            await updateDoc(doc(db, "conversations", conversationId), {
                updatedAt: serverTimestamp(),
                lastMessage: newMessage
            });

            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const suggestMeetup = async () => {
        const defaultLocation = `${listing.university} Campus Center`;

        try {
            await addDoc(collection(db, "messages"), {
                conversationId,
                senderId: currentUser.id,
                content: `Let's meet at ${defaultLocation} for the exchange. Does this work for you?`,
                isMeetupSuggestion: true,
                suggestedLocation: defaultLocation,
                timestamp: serverTimestamp(),
                read: false
            });

            await updateDoc(doc(db, "conversations", conversationId), {
                updatedAt: serverTimestamp(),
                lastMessage: "[Meetup Suggestion]"
            });
        } catch (error) {
            console.error("Error sending meetup suggestion:", error);
        }
    };

    return (
        <div className="chat-modal-overlay">
            <div className="chat-modal">
                <div className="chat-header">
                    <div className="chat-seller">
                        <img
                            src={sellerData?.photoURL || "/default-avatar.png"}
                            alt="Seller"
                            className="chat-avatar"
                        />
                        <div>
                            <h4>{sellerData?.displayName || "Seller"}</h4>
                            <small>About: {listing.title}</small>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                <div className="chat-body">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : messages.length === 0 ? (
                        <p className="empty">Start your conversation about {listing.title}</p>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`chat-message ${msg.senderId === currentUser.id ? "sent" : "received"}`}
                            >
                                <p>{msg.content}</p>
                                {msg.isMeetupSuggestion && (
                                    <div className="meetup-note">📍 Suggested meetup: {msg.suggestedLocation}</div>
                                )}
                                <small>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                <div className="chat-input">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Type your message..."
                        disabled={isSending}
                    />
                    <button onClick={handleSendMessage} disabled={newMessage.trim() === "" || isSending}>
                        {isSending ? "..." : "Send"}
                    </button>
                    <button onClick={suggestMeetup} title="Suggest meetup">📍</button>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;
