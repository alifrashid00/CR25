import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./components/SignUp";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./components/Login.jsx";
import Listing from "./pages/listing/listing.jsx";
import ListingDetail from "./pages/listing/[id].jsx";
import Services from "./pages/services/services.jsx";
import OfferServices from "./pages/services/offer-services.jsx";
import Sell from "./pages/sell/sell.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import RoleBasedRoute from "./components/RoleBasedRoute.jsx";
import ServiceDetail from './pages/services/ServiceDetail';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Protected Routes */}
                <Route 
                    path="/dashboard" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Dashboard />
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/listing" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Listing />
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/sell" 
                    element={
                        <RoleBasedRoute allowedRoles={["student"]}>
                            <Sell />
                        </RoleBasedRoute>
                    } 
                />



                <Route 
                    path="/listing/:id" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <ListingDetail />
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/services" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Services />
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/offer-service" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <OfferServices />
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/services/:id" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <ServiceDetail />
                        </RoleBasedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;