// src/pages/AdminLogin.jsx (FINAL VERSION - NO ALERT, DIRECT DASHBOARD)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminLogin.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminLogin = () => {
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
      console.log('🔥 Login attempt:', { email: email.substring(0,3)+'...', password: '***' });
      
      const res = await axios.post(`${API_BASE}/api/admin/login`, {
        email: email.trim(),
        password: password.trim()
      });

      // ✅ NO ALERT - DIRECT DASHBOARD!
      if (res.data?.success) {
        localStorage.setItem("bgmi_admin_token", res.data.token);
        localStorage.setItem("bgmi_admin_logged_in", "true");
        localStorage.setItem("bgmi_admin_email", res.data.admin.email);
        
        // IMMEDIATE REDIRECT - NO POPUP!
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      throw new Error("Invalid credentials");
      
    } catch (err) {
      console.error("Admin login error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Invalid admin email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page hacker-bg">
      <div className="auth-card hacker-card">
        <div className="auth-header">
          <span className="auth-badge">HACKER ADMIN</span>
          <h2 className="page-title">Admin Login</h2>
          <p className="page-subtitle">
            Access the BGMI Esports Control Room. Only authorized admin allowed.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-label">
            <span>Admin Email</span>
            <input
              type="email"
              className="form-input hacker-input"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="form-label">
            <span>Password</span>
            <input
              type="password"
              className="form-input hacker-input"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            className="btn-primary hacker-btn"
            disabled={loading}
          >
            {loading ? "Initializing access..." : "Login as Admin"}
          </button>

          <p className="auth-footer-text">
            Unauthorized access will be <strong>traced</strong> and{" "}
            <strong>logged</strong>.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
