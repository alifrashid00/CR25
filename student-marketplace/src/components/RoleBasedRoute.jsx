import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function RoleBasedRoute({ children, allowedRoles }) {
    const { user } = useAuth();
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.email));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
            }
            setLoading(false);
        };

        fetchUserRole();
    }, [user]);

    if (loading) {
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