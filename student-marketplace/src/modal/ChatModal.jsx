import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase.js';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import './ChatModal.css'

const ChatModal = ({ conversationId, currentUserId, receiverId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
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
        });

        setNewMessage('');
        scrollToBottom();
    };

    return (
        <div className="chat-modal-overlay">
            <div className="chat-modal-container">
                <button className="chat-close-button" onClick={onClose}>✕</button>
                <div className="chat-messages">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chat-message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}
                        >
                            {msg.text}
                        </div>
                    ))}
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
                    <button onClick={handleSend}>Send</button>
                </div>
            </div>

          
        </div>

    );
};

export default ChatModal;
