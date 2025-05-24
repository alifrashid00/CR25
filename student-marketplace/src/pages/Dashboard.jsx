import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div className="dashboard-content">
                {/* Your dashboard content here */}
                <p>Welcome to your dashboard!</p>

            </div>
        </div>
    );
}