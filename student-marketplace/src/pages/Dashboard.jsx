import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import buyImage from '../assets/buy.png';
import bidImage from '../assets/bid.png';
import servicesImage from '../assets/services.png';

export default function Dashboard() {
    const navigate = useNavigate();

    const dashboardCards = [
        {
            title: 'Listings',
            description: 'Manage your product listings, create new ones, or edit existing ones.',
            image: buyImage,
            route: '/listing'
        },
        {
            title: 'Manage Bids',
            description: 'View and manage bids on your listings, accept or reject offers.',
            image: bidImage,
            route: '/manage-bids'
        },
        {
            title: 'Services',
            description: 'Offer your services or find services from other students.',
            image: servicesImage,
            route: '/services'
        }
    ];

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div className="dashboard-content">
                <div className="dashboard-cards">
                    {dashboardCards.map((card, index) => (
                        <div 
                            key={index} 
                            className="dashboard-card"
                            onClick={() => navigate(card.route)}
                        >
                            <div className="card-image">
                                <img src={card.image} alt={card.title} />
                            </div>
                            <div className="card-content">
                                <h2>{card.title}</h2>
                                <p>{card.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
