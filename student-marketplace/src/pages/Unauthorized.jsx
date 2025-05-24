import { useNavigate } from 'react-router-dom';
import './Unauthorized.css';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="unauthorized-container">
            <h1>Access Denied</h1>
            <p>You don't have permission to access this page.</p>
            <button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
            </button>
        </div>
    );
};

export default Unauthorized; 