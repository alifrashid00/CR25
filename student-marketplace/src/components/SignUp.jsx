import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function SignUp() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { signUp, isUniversityEmail } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            if (!isUniversityEmail(email)) {
                throw new Error("Please use your university email address");
            }
            await signUp(email, password);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            <h2>Sign Up</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="University email"
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
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}