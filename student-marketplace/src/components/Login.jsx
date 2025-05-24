import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const auth = getAuth();
            const result = await signInWithEmailAndPassword(auth, email, password);
            
            if (!result.user.emailVerified) {
                // If email is not verified, send a new verification email and show message
                await sendEmailVerification(result.user);
                await auth.signOut();
                setError("Please verify your email first. A new verification link has been sent to your email address.");
                setLoading(false);
                return;
            }
            
            // Check if user is suspended
            const userDocRef = doc(db, "users", email);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists() && userDocSnap.data().suspended) {
                // Sign out the user if they are suspended
                await auth.signOut();
                navigate("/suspended");
                return;
            }

            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Welcome Back</h2>
                <p className="login-subtitle">Login to your student account</p>
                {error && <p className="login-error">{error}</p>}
                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
                <div className="login-links">
                    <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
                    <p><Link to="/forgot-password">Forgot Password?</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
