import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./components/Login.jsx";
import Listing from "./pages/listing/listing.jsx";
import ListingDetail from "./pages/listing/[id].jsx";
import Services from "./pages/services/services.jsx";
import OfferServices from "./pages/services/offer-services.jsx";
import Sell from "./pages/sell/sell.jsx";
import ServiceDetail from './pages/services/ServiceDetail';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />

                <Route path="/listing" element={<Listing />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/services" element={<Services />} />
                <Route path="/offer-service" element={<OfferServices />} />
                <Route path="/services/:id" element={<ServiceDetail />} />
                <Route path="/sell" element={<Sell />} />
            </Routes>
        </Router>
    );
}

export default App;