import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = ({ count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={`skeleton-${index}`} className="skeleton-card">
                    <div className="skeleton skeleton-image"></div>
                    <div className="skeleton-content">
                        <div className="skeleton skeleton-title"></div>
                        <div className="skeleton skeleton-text"></div>
                        <div className="skeleton skeleton-text short"></div>
                        <div className="skeleton-footer">
                            <div className="skeleton skeleton-price"></div>
                            <div className="skeleton skeleton-rating"></div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default SkeletonCard;
