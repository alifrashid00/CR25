import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./signup.css";

const SignUp = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        studentId: "",
        phoneNumber: "",
        role: "student",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const auth = getAuth();
            const { email, password, ...userData } = formData;
            
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Store additional user data in Firestore using email as document ID
            await setDoc(doc(db, "users", email), {
                ...userData,
                uid: userCredential.user.uid,
                email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Redirect to dashboard after successful signup
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="studentId">Student ID</label>
                    <input
                        type="text"
                        id="studentId"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <button type="submit">Sign Up</button>
                
                <div className="signup-link">
                    Already have an account? <a href="/login">Login</a>
                </div>
            </form>
        </div>
    );
};

export default SignUp;