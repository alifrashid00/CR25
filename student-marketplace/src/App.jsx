import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./components/Login.jsx";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />

            </Routes>
        </Router>
    );
}

export default App;