import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./signup.css";

const SignUp = () => {
    const [formData, setFormData] = useState({        firstName: "",
        lastName: "",
        email: "",
        password: "",
        studentId: "",
        phoneNumber: "",
        role: "student",
        dateOfBirth: "",
        department: "",
        program: "",
        yearOfStudy: "",
        university: "",
        isCoAdmin: false,
        suspended: false
    });
    const [previewPic, setPreviewPic] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfilePicChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                resizeImage(reader.result, 200, 200, (resizedImage) => {
                    setPreviewPic(resizedImage);
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                resizeImage(reader.result, 200, 200, (resizedImage) => {
                    setPreviewPic(resizedImage);
                });
            };
            reader.readAsDataURL(file);
        }
    };    const resizeImage = (base64Str, maxWidth, maxHeight, callback) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const scaleFactor = Math.min(maxWidth / width, maxHeight / height);
                width *= scaleFactor;
                height *= scaleFactor;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            // Using PNG format for maximum quality and WebP as a fallback
            try {
                const webpData = canvas.toDataURL("image/webp", 1.0);
                if (webpData.length < 1024 * 1024) { // Check if less than 1MB
                    callback(webpData);
                } else {
                    // If WebP is too large, fallback to PNG
                    callback(canvas.toDataURL("image/png"));
                }
            } catch (e) {
                // If WebP is not supported, use PNG
                callback(canvas.toDataURL("image/png"));
            }
        };
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const auth = getAuth();
            const { email, password, ...userData } = formData;
            
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Send verification email
            await sendEmailVerification(userCredential.user);
            
            // Store additional user data in Firestore using email as document ID
            await setDoc(doc(db, "users", email), {
                ...userData,
                uid: userCredential.user.uid,
                email,
                profilePic: previewPic || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                emailVerified: false
            });

            // Show verification message and redirect
            alert("A verification email has been sent to your email address. Please verify your email before logging in.");
            await auth.signOut(); // Sign out the user until they verify their email
            navigate("/login");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-group profile-pic-container">
                    <label htmlFor="profilePic">Profile Picture</label>
                    <div 
                        className="profile-pic-dropzone"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {previewPic ? (
                            <img src={previewPic} alt="Profile preview" className="profile-preview" />
                        ) : (
                            <div className="upload-placeholder">
                                Drag & drop an image here or click to select
                            </div>
                        )}
                        <input
                            type="file"
                            id="profilePic"
                            name="profilePic"
                            accept="image/*"
                            onChange={handleProfilePicChange}
                            className="profile-pic-input"
                        />
                    </div>
                </div>

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
                    <label htmlFor="dateOfBirth">Date of Birth</label>
                    <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
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
                </div>                <div className="form-group">
                    <label htmlFor="university">University</label>
                    <input
                        type="text"
                        id="university"
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                        type="text"
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g., Computer Science and Engineering"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="program">Program</label>
                    <input
                        type="text"
                        id="program"
                        name="program"
                        value={formData.program}
                        onChange={handleChange}
                        placeholder="e.g., BSc in Computer Science"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="yearOfStudy">Year of Study</label>
                    <select
                        id="yearOfStudy"
                        name="yearOfStudy"
                        value={formData.yearOfStudy}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year</option>
                    </select>
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



                <button type="submit">Sign Up</button>
                
                <div className="signup-link">
                    Already have an account? <a href="/login">Login</a>
                </div>
            </form>
        </div>
    );
};

export default SignUp;