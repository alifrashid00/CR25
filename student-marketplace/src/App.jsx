import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
// import Login from "./components/Login";
// import Dashboard from "./components/Dashboard";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/signup" element={<SignUp />} />

            </Routes>
        </Router>
    );
}

export default App;