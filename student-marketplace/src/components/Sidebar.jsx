import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.email) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.email));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        fetchUserData();
    }, [user]);

    const handleLogout = async () => {
        try {
            await logOut();
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const isActive = (path) => location.pathname === path;

    const getFullName = () => {
        if (userData) {
            return `${userData.firstName} ${userData.lastName}`.trim();
        }
        return "User";
    };

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
                <Link to="/manage-bids" className={`nav-item ${isActive('/manage-bids') ? 'active' : ''}`}>
                    Manage Bids
                </Link>
                <Link to="/sell" className={`nav-item ${isActive('/sell') ? 'active' : ''}`}>
                    Sell Item
                </Link>                <Link to="/services" className={`nav-item ${isActive('/services') ? 'active' : ''}`}>
                    Browse Services
                </Link>
                <Link to="/my-services" className={`nav-item ${isActive('/my-services') ? 'active' : ''}`}>
                    My Services
                </Link>
                <Link to="/offer-service" className={`nav-item ${isActive('/offer-service') ? 'active' : ''}`}>
                    Offer Service
                </Link>
                {userData?.role === 'admin' && (
                    <Link to="/manage-students" className={`nav-item ${isActive('/manage-students') ? 'active' : ''}`}>
                        Manage Students
                    </Link>
                )}
            </nav>
            <div className="sidebar-footer">
                {user && (
                    <>
                        <div className="profile-section">                            <img 
                                src={userData?.profilePic || "/default-avatar.png"} 
                                alt="Profile" 
                                className="profile-photo"
                            />
                            <div className="profile-info">
                                <span className="profile-name">{getFullName()}</span>
                                <button onClick={() => navigate('/profile')} className="profile-button">
                                    View Profile
                                </button>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="logout-button">
                            Logout
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
