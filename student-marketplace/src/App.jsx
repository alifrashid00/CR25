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
import Suspended from "./pages/Suspended.jsx";
import RoleBasedRoute from "./components/RoleBasedRoute.jsx";
import ServiceDetail from './pages/services/ServiceDetail';
import Sidebar from './components/Sidebar';
import Profile from "./pages/profile/Profile.jsx";
import ManageStudents from "./pages/admin/ManageStudents.jsx";
import MyListings from "./pages/listing/MyListings.jsx";
import MyServices from "./pages/services/MyServices.jsx";
import EditListing from "./pages/listing/EditListing.jsx";
import EditService from "./pages/services/EditService.jsx";
import AdminViewProfile from "./pages/admin/AdminViewProfile.jsx";
import BidManagement from "./components/BidManagement.jsx";
import ApprovePosts from "./pages/admin/ApprovePosts.jsx";

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
                {/* Public routes without sidebar */}                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/suspended" element={<Suspended />} />
                
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
                />                <Route 
                    path="/profile" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <Profile />
                            </Layout>
                        </RoleBasedRoute>
                    }
                />
                <Route 
                    path="/manage-students" 
                    element={
                        <RoleBasedRoute allowedRoles={["admin"]}>
                            <Layout>
                                <ManageStudents />
                            </Layout>
                        </RoleBasedRoute>
                    }
                />
                <Route    
                    path="/my-listings"
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <MyListings />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/my-services" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <MyServices />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/manage-bids" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <BidManagement />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/listing/:id/edit" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <EditListing />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/services/:id/edit" 
                    element={
                        <RoleBasedRoute allowedRoles={["student", "admin"]}>
                            <Layout>
                                <EditService />
                            </Layout>
                        </RoleBasedRoute>
                    } 
                />
                <Route 
                    path="/manage-students/:email" 
                    element={
                        <RoleBasedRoute allowedRoles={["admin"]}>
                            <Layout>
                                <AdminViewProfile />
                            </Layout>
                        </RoleBasedRoute>
                    }
                />
                <Route 
                    path="/approve-posts" 
                    element={
                        <RoleBasedRoute allowedRoles={["student"]}>
                            <Layout>
                                <ApprovePosts />
                            </Layout>
                        </RoleBasedRoute>
                    }
                />
                
                {/* Catch-all route for invalid URLs */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

        </Router>
    );
}

export default App;