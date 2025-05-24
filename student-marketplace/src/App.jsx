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
import Sidebar from './components/Sidebar';
import Profile from "./pages/profile/Profile.jsx";

// Layout component that includes the sidebar
const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                {children}
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public routes without sidebar */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Protected Routes with sidebar */}
                <Route 
                    path="/dashboard" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/listing" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <Listing />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/sell" 
                    element={
                        <RoleBasedRoute allowedRoles={["student"]}>
                            <Layout>
                                <Sell />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/listing/:id" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <ListingDetail />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/services" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <Services />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/offer-service" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <OfferServices />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/services/:id" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <ServiceDetail />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/profile" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <Profile />
                            </Layout>
                        </RoleBasedRoute>
                    }
                />
            </Routes>

        </Router>
    );
}

export default App;