import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/firebase.js';
import ChatModal from './ChatModal';

const ChatListModal = ({ listing, sellerId, onClose }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Create query based on whether listing is provided
                let q;
                if (listing) {
                    q = query(
                        collection(db, 'conversations'),
                        where('sellerId', '==', sellerId),
                        where('listingId', '==', listing.id)
                    );
                } else {
                    q = query(
                        collection(db, 'conversations'),
                        where('sellerId', '==', sellerId)
                    );
                }

                const querySnapshot = await getDocs(q);
                const conversationsData = [];

                // Process each conversation
                for (const docSnap of querySnapshot.docs) {
                    const convo = docSnap.data();
                    
                    try {
                        // Get buyer info
                        const buyerRef = doc(db, 'users', convo.buyerId);
                        const buyerSnap = await getDoc(buyerRef);
                        
                        if (buyerSnap.exists()) {
                            const buyerData = buyerSnap.data();
                            conversationsData.push({
                                id: docSnap.id,
                                buyerId: convo.buyerId,
                                listingId: convo.listingId,
                                lastMessage: convo.lastMessage || '',
                                updatedAt: convo.updatedAt?.toDate?.() || new Date(),
                                buyerInfo: {
                                    id: convo.buyerId,
                                    displayName: `${buyerData.firstName || 'User'} ${buyerData.lastName || ''}`.trim(),
                                    photoURL: buyerData.profilePic || '/default-avatar.png',
                                },
                                listingInfo: {
                                    title: convo.listingTitle || 'Listing',
                                    image: convo.listingImage || '',
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Error processing conversation:', err);
                    }
                }

                // Sort by most recent update
                conversationsData.sort((a, b) => b.updatedAt - a.updatedAt);
                setConversations(conversationsData);
                setLoading(false);
                
            } catch (err) {
                console.error('Failed to fetch conversations:', err);
                setError('Failed to load conversations. Please try again.');
                setLoading(false);
            }
        };

        fetchConversations();
    }, [listing, sellerId]);

    if (selectedConversation) {
        return (
            <ChatModal
                listing={{
                    id: selectedConversation.listingId,
                    title: selectedConversation.listingInfo.title,
                    images: [selectedConversation.listingInfo.image],
                    userId: sellerId,
                }}
                currentUser={{ id: sellerId }}
                onClose={() => setSelectedConversation(null)}
            />
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3>{listing ? 'Buyers for this listing' : 'All conversations'}</h3>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem'
                    }}>×</button>
                </div>
                
                {error ? (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#d32f2f',
                        backgroundColor: '#ffebee',
                        margin: '10px',
                        borderRadius: '4px'
                    }}>{error}</div>
                ) : loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading conversations...</div>
                ) : conversations.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        {listing ? 'No buyers have messaged about this listing yet.' : 'No conversations yet.'}
                    </div>
                ) : (
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        overflowY: 'auto',
                        flexGrow: 1
                    }}>
                        {conversations.map((convo) => (
                            <li key={convo.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                <button 
                                    onClick={() => setSelectedConversation(convo)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <img
                                        src={convo.buyerInfo.photoURL}
                                        alt={convo.buyerInfo.displayName}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            marginRight: '12px'
                                        }}
                                        onError={(e) => {
                                            e.target.src = '/default-avatar.png';
                                        }}
                                    />
                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ fontWeight: '600' }}>{convo.buyerInfo.displayName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{convo.listingInfo.title}</div>
                                        {convo.lastMessage && (
                                            <div style={{
                                                fontSize: '0.9rem',
                                                color: '#777',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {convo.lastMessage.length > 30
                                                    ? `${convo.lastMessage.substring(0, 30)}...`
                                                    : convo.lastMessage}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                                        {convo.updatedAt.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ChatListModal;