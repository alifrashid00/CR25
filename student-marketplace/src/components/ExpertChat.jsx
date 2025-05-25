import React, { useState } from 'react';
import './ExpertChat.css';

const ExpertChat = ({ listing, service, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    // Determine if we're dealing with a listing or service
    const item = listing || service;
    const itemType = listing ? 'listing' : 'service';

    const analyzeItem = async () => {
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
                            content: `You are an expert market analyst for student marketplace ${itemType}s. Analyze the ${itemType} and provide a detailed assessment and recommendation.`
                        },
                        {
                            role: 'user',
                            content: itemType === 'listing' ? 
                                `Please analyze this listing and provide:
1. A summary of the item
2. Estimated market value
3. Fair price recommendation
4. Buying advice
5. Give everything in one paragraph

Listing details:
Title: ${item.title}
Price: ${item.price}
Condition: ${item.condition}
Category: ${item.category}
Description: ${item.description}` :
                                `Please analyze this service and provide:
1. A summary of the service
2. Market rate assessment
3. Fair rate recommendation
4. Hiring advice
5. Give everything in one paragraph

Service details:
Title: ${item.title}
Rate: ৳${item.hourlyRate}/hour
Category: ${item.category}
Skill Level: ${item.skillLevel}
University: ${item.university}
Description: ${item.description}
Skills: ${item.skills?.join(', ') || 'Not specified'}`
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
            console.error(`Error analyzing ${itemType}:`, error);
            setAnalysis(`Sorry, I encountered an error while analyzing the ${itemType}: ${error.message}. Please try again later.`);
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
                        analyzeItem();
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
                            <div className="loading">Analyzing {itemType}...</div>
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