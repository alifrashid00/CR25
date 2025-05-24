import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Unauthorized.css'; // We can reuse the Unauthorized page styles

const Suspended = () => {
    const navigate = useNavigate();

    return (
        <div className="unauthorized-container">
            <h1>Account Suspended</h1>
            <p>Your account has been suspended due to violation of community guidelines.</p>
            <p>If you believe this is an error, please contact the administrators.</p>
            <button onClick={() => navigate('/login')}>
                Return to Login
            </button>
        </div>
    );
};

export default Suspended;
