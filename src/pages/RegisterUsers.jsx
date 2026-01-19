// bgmi-admin-panel/src/pages/RegisterUsers.jsx
import { useEffect, useState } from "react";
import axios from "axios";

// ✅ USER AUTH SERVER (OTP / REGISTER SERVER)
const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5001";

const RegisterUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ===============================
     LOAD USERS FROM USER SERVER
  ================================ */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/admin/users`);

      const list = res.data.map((u, idx) => ({
        id: u.id,
        index: idx + 1,
        profileId: u.profile_id || "-",
        name: u.name || "-",
        email: u.email || "-",

        // 🔥 REAL PASSWORD (FROM users.json)
        password: u.password_plain || "****",

        registeredAt: u.created_at
          ? new Date(u.created_at)
          : new Date(),
      }));

      setUsers(list);
      console.log("ADMIN USERS LOADED:", list);
    } catch (err) {
      console.error("Load users error:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     DELETE USER
  ================================ */
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/admin/users/${id}`);
      loadUsers();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Delete failed");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="page">
      <h2 className="page-title">Register Users</h2>
      <p className="page-subtitle">
        BGMI Esports – Registered Players (Admin View)
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="alert alert-info">Loading...</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Profile ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Password (REAL)</th>
            <th>Register Time</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.index}</td>
              <td className="bgmi-id">{u.profileId}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td style={{ fontWeight: "bold" }}>{u.password}</td>
              <td>{u.registeredAt.toLocaleString()}</td>
              <td>
                <button className="btn-secondary" disabled>
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(u.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {!loading && users.length === 0 && (
            <tr>
              <td colSpan="7" className="empty-row">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RegisterUsers;
