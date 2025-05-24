import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logOut();
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Student Marketplace</h2>
            </div>
            <nav className="sidebar-nav">
                <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                    Dashboard
                </Link>
                <Link to="/listing" className={`nav-item ${isActive('/listing') ? 'active' : ''}`}>
                    Browse Listings
                </Link>
                <Link to="/my-listings" className={`nav-item ${isActive('/my-listings') ? 'active' : ''}`}>
                    My Listings
                </Link>
                <Link to="/sell" className={`nav-item ${isActive('/sell') ? 'active' : ''}`}>
                    Sell Item
                </Link>
                <Link to="/services" className={`nav-item ${isActive('/services') ? 'active' : ''}`}>
                    Browse Services
                </Link>
                <Link to="/my-services" className={`nav-item ${isActive('/my-services') ? 'active' : ''}`}>
                    My Services
                </Link>
                <Link to="/offer-service" className={`nav-item ${isActive('/offer-service') ? 'active' : ''}`}>
                    Offer Service
                </Link>
            </nav>
            <div className="sidebar-footer">
                {user && (
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
