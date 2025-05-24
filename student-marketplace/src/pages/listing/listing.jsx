import React from 'react';
import { useNavigate } from 'react-router-dom';
import './listing.css';

const Listing = () => {
    const navigate = useNavigate();

    const handleFilter = () => {
        // TODO: Implement filter functionality
        console.log('Filter clicked');
    };    
    
    const handleSell = () => {
        navigate('/sell');
    };

    return (
        <div className="listing-container">
            <div className="button-container">
                <button className="filter-button" onClick={handleFilter}>
                    Filter
                </button>
                <button className="sell-button" onClick={handleSell}>
                    Sell
                </button>
            </div>
            {/* Add your listing content here */}
        </div>
    );
};

export default Listing;