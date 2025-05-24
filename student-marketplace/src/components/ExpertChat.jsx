import React, { useState } from 'react';
import './ExpertChat.css';

const ExpertChat = ({ listing, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    const analyzeListing = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer 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`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert market analyst for student marketplace items. Analyze the listing and provide a detailed market value assessment and buying advice.'
                        },
                        {
                            role: 'user',
                            content: `Please analyze this listing and provide:
1. A summary of the item
2. Estimated market value
3. Fair price recommendation
4. Buying advice
5. give every thing into one paragraph

Listing details:
Title: ${listing.title}
Price: ${listing.price}
Condition: ${listing.condition}
Category: ${listing.category}
Description: ${listing.description}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            
            // Check if we have a valid response structure
            if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from API');
            }

            const analysisText = data.choices[0].message.content;
            if (!analysisText) {
                throw new Error('No analysis content received');
            }

            setAnalysis(analysisText);
        } catch (error) {
            console.error('Error analyzing listing:', error);
            setAnalysis(`Sorry, I encountered an error while analyzing the listing: ${error.message}. Please try again later.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`expert-chat ${isExpanded ? 'expanded' : ''}`}>
            <button 
                className="expert-chat-button"
                onClick={() => {
                    setIsExpanded(!isExpanded);
                    if (!isExpanded && !analysis) {
                        analyzeListing();
                    }
                }}
            >
                👨‍🎓
            </button>
            
            {isExpanded && (
                <div className="expert-chat-content">
                    <div className="expert-chat-header">
                        <h3>Expert Analysis</h3>
                        <button className="close-button" onClick={() => {
                            setIsExpanded(false);
                            if (onClose) onClose();
                        }}>×</button>
                    </div>
                    
                    <div className="expert-chat-body">
                        {loading ? (
                            <div className="loading">Analyzing listing...</div>
                        ) : analysis ? (
                            <div className="analysis-content">
                                {analysis.split('\n').map((line, index) => (
                                    <p key={index}>{line}</p>
                                ))}
                            </div>
                        ) : (
                            <div className="error">Failed to load analysis</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpertChat; 