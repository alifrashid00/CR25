import React, { useState } from 'react';
import './Estimator.css';

const Estimator = ({ title, description, images, onEstimate }) => {
    const [loading, setLoading] = useState(false);

    const analyzeItem = async () => {
        setLoading(true);
        try {
            // Convert images to base64 if they exist
            let imageDescriptions = [];
            if (images && images.length > 0) {
                imageDescriptions = await Promise.all(images.map(async (file) => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            resolve(`The image shows: ${reader.result.substring(0, 100)}`);
                        };
                        reader.readAsDataURL(file);
                    });
                }));
            }

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
                            content: 'You are an expert at estimating the condition and fair price of items in a student marketplace. Analyze the item details and suggest a condition (new, like-new, good, fair, poor) and a fair price in USD. Return only JSON in this format: {"condition": "condition-here", "price": number-here}'
                        },
                        {
                            role: 'user',
                            content: `Please analyze this item and suggest a condition and fair price:
Title: ${title}
Description: ${description}
${imageDescriptions.length > 0 ? 'Images: ' + imageDescriptions.join('\n') : ''}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get estimation');
            }

            const data = await response.json();
            const estimationText = data.choices[0].message.content;
            const estimation = JSON.parse(estimationText);
            
            onEstimate(estimation);
        } catch (error) {
            console.error('Error estimating:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="estimator">
            <button 
                className="estimator-button"
                onClick={analyzeItem}
                disabled={loading || !title || !description}
                title={!title || !description ? "Please fill in title and description first" : "Get price and condition estimate"}
            >
                {loading ? '⏳' : '💡'}
            </button>
        </div>
    );
};

export default Estimator;
