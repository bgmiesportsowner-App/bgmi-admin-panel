// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import RegisterUsers from "./pages/RegisterUsers";
import RoomManagement from "./pages/RoomManagement";
import TdmJoins from "./pages/TdmJoins";
import Settings from "./pages/Settings";
import "./styles/theme.css";

function App() {
  return (
    <Router>
      <div className="app-root">
        <Sidebar />
        <div className="app-main">
          <Topbar />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/register-users" element={<RegisterUsers />} />
              <Route path="/rooms" element={<RoomManagement />} />
              <Route path="/tdm-joins" element={<TdmJoins />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
