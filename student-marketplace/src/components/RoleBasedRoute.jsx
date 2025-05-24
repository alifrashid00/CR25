import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";

export default function RoleBasedRoute({ children, allowedRoles }) {
    const { user, userRole, loading, roleLoading } = useAuth();

    // Show loading state while authentication or role verification is in progress
    if (loading || roleLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (!userRole || !allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
}