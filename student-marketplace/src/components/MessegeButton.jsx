import React, { useState } from 'react';
import ChatModal from "../modal/ChatModal.jsx";

const MessageButton = ({ listing, currentUser }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleMessageClick = () => {
        if (!currentUser) return;
        setIsChatOpen(true);
    };

    return (
        <>
            <button
                onClick={handleMessageClick}
                style={{
                    padding: "8px 16px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: "#fff",
                    cursor: "pointer"
                }}
            >
                Message Seller
            </button>

            {isChatOpen && (
                <ChatModal
                    listing={listing}
                    currentUser={currentUser}
                    onClose={() => setIsChatOpen(false)}
                />
            )}
        </>
    );
};

export default MessageButton;
