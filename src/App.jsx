// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import RegisterUsers from "./pages/RegisterUsers";
import RoomManagement from "./pages/RoomManagement";
import TdmJoins from "./pages/TdmJoins";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/AdminLogin";
import "./styles/theme.css";

// Helper: check admin login flag
const isAdminLoggedIn = () =>
  localStorage.getItem("bgmi_admin_logged_in") === "true";

// Layout for all admin pages
const AdminLayout = () => (
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
          {/* koi bhi unknown path ho to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  </div>
);

// Wrapper: agar login nahi hai to /admin-login
const ProtectedApp = () => {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin-login" replace />;
  }
  return <AdminLayout />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin login page (without sidebar/topbar) */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Baaki sab routes protected */}
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </Router>
  );
}

export default App;
