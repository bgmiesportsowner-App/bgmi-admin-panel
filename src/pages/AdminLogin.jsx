// src/pages/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const ADMIN_EMAIL = "admin@bgmi.com";
const ADMIN_PASSWORD = "Admin@123";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setLoading(true);
      localStorage.setItem("bgmi_admin_logged_in", "true");
      // protected app ka root, jo dashboard show karega
      navigate("/", { replace: true });
    } else {
      setError("Invalid admin email or password");
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
              placeholder="enter@bgmi-admin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </label>

          <label className="form-label">
            <span>Password</span>
            <input
              type="password"
              className="form-input hacker-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
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
