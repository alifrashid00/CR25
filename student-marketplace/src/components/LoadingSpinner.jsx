import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', overlay = false, className = '' }) => {
    const sizeClass = `spinner-${size}`;
    
    if (overlay) {
        return (
            <div className={`loading-overlay ${className}`}>
                <div className="loading-content">
                    <div className={`spinner ${sizeClass}`}></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`loading-spinner ${className}`}>
            <div className={`spinner ${sizeClass}`}></div>
        </div>
    );
};

export default LoadingSpinner;
