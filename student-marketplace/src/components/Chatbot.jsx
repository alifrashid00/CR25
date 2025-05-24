import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse, extractFiltersFromResponse } from '../services/groq';
import './Chatbot.css';

const Chatbot = ({ onFiltersUpdate, isOpen, onToggle }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm here to help you find the perfect items. What are you looking for today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await getChatbotResponse(inputMessage, conversationHistory);
      
      // Update conversation history
      const newHistory = [
        ...conversationHistory,
        { role: "user", content: inputMessage },
        { role: "assistant", content: JSON.stringify(response) }
      ];
      setConversationHistory(newHistory);

      let botResponseText;
      
      if (response.response) {
        // Bot is asking for more information
        botResponseText = response.response;
      } else {
        // Bot extracted filters, apply them and provide confirmation
        const extractedFilters = extractFiltersFromResponse(response);
        
        if (Object.keys(extractedFilters).length > 0) {
          onFiltersUpdate(extractedFilters);
          
          // Create a friendly confirmation message
          const filterDescriptions = [];
          if (extractedFilters.searchQuery) filterDescriptions.push(`searching for "${extractedFilters.searchQuery}"`);
          if (extractedFilters.category) filterDescriptions.push(`in ${extractedFilters.category}`);
          if (extractedFilters.minPrice || extractedFilters.maxPrice) {
            const priceRange = `${extractedFilters.minPrice || '0'} - ${extractedFilters.maxPrice || '∞'}`;
            filterDescriptions.push(`price range: ৳${priceRange}`);
          }
          if (extractedFilters.condition) filterDescriptions.push(`condition: ${extractedFilters.condition}`);
          if (extractedFilters.pricingType) filterDescriptions.push(`pricing: ${extractedFilters.pricingType}`);
          
          botResponseText = `Great! I've applied filters ${filterDescriptions.join(', ')}. You should see the updated results now. Need anything else?`;
        } else {
          botResponseText = "I understand you're looking for something, but could you provide more specific details about what you need?";
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botResponseText,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble understanding right now. Could you try rephrasing your request?",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hi! I'm here to help you find the perfect items. What are you looking for today?",
        isBot: true,
        timestamp: new Date()
      }
    ]);
    setConversationHistory([]);
  };

  if (!isOpen) {
    return (
      <div className="chatbot-toggle" onClick={onToggle}>
        <div className="chatbot-icon">💬</div>
        <span>Chat Assistant</span>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-icon">🤖</span>
          <span>Shopping Assistant</span>
        </div>
        <div className="chatbot-controls">
          <button onClick={clearChat} className="clear-chat-btn" title="Clear Chat">
            🗑️
          </button>
          <button onClick={onToggle} className="close-chat-btn" title="Close Chat">
            ✕
          </button>
        </div>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
          >
            <div className="message-content">
              {message.text}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me to help you find items..."
          disabled={isLoading}
          rows={1}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="send-button"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
