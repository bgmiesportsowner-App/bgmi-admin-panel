// src/pages/AdminLogin.jsx (RENDER + LOCALHOST BOTH WORKING)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminLogin.css";

// ✅ AUTO DETECTS LOCAL vs PRODUCTION
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // Render.com pe hai?
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://bgmi-admin-panel.onrender.com';
    }
    // Local development
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:5000';
    }
  }
  // Fallback
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiBase, setApiBase] = useState("http://localhost:5000");
  const navigate = useNavigate();

  // ✅ API BASE AUTO SET ON MOUNT
  useEffect(() => {
    const base = getApiBase();
    setApiBase(base);
    console.log('🔗 Using API:', base);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('🔥 Login attempt:', { 
        email: email.substring(0,3)+'...', 
        password: '***',
        api: apiBase 
      });
      
      const res = await axios.post(`${apiBase}/api/admin/login`, {
        email: email.trim(),
        password: password.trim()
      });

      // ✅ NO ALERT - DIRECT DASHBOARD!
      if (res.data?.success) {
        localStorage.setItem("bgmi_admin_token", res.data.token);
        localStorage.setItem("bgmi_admin_logged_in", "true");
        localStorage.setItem("bgmi_admin_email", res.data.admin.email);
        
        console.log('✅ Login success - redirecting to dashboard');
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
          {/* DEBUG INFO */}
          <small style={{color: '#666'}}>
            API: {apiBase}
          </small>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-label">
            <span>Admin Email</span>
            <input
              type="email"
              className="form-input hacker-input"
              placeholder="admin@bgmi.com"
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
