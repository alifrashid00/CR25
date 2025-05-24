import { useNavigate } from 'react-router-dom';
import MessageButton from "../components/MessegeButton.jsx";

export default function Dashboard() {
    const dummyListing = {
        id: "test-listing-123",
        title: "Test Product",
        sellerId: "seller-456",
        images: ["/default.jpg"],
        university: "IUT"
    };

    const dummyUser = {
        id: "user-789",
        displayName: "Afra Tester",
        photoURL: "/avatar.png"
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div className="dashboard-content">
                <p>Welcome to your dashboard!</p>

                {/* Inject test data */}
                <MessageButton listing={dummyListing} currentUser={dummyUser} />
            </div>
        </div>
    );
}
