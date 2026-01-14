// bgmi-admin-panel/src/pages/RegisterUsers.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ✅ BGMI ID Generator
const generateBGMIId = () => `BGMI-${Math.floor(10000 + Math.random() * 90000)}`;

const RegisterUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load users from backend
  const loadUsers = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await axios.get(`${API_BASE}/admin/users`);
      const list = res.data.map((u, idx) => ({
        id: u.id,
        index: idx + 1,
        profileId: u.profile_id || "-",  // ✅ Profile ID
        name: u.name || "-",
        email: u.email || "-",
        password: u.password_plain || u.password || "****",
        registeredAt: u.created_at ? new Date(u.created_at) : new Date(),
      }));
      setUsers(list);
      console.log('Loaded users:', list);
    } catch (err) {
      console.error("Load users error:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError("");
      await axios.delete(`${API_BASE}/admin/users/${id}`);
      loadUsers(); // Refresh
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
        Manage BGMI player registrations with auto Profile IDs.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="alert alert-info">Loading...</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Profile ID</th>        {/* ✅ NEW */}
            <th>Name</th>
            <th>Email</th>
            <th>Password</th>
            <th>Register Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.index}</td>
              <td className="bgmi-id">{u.profileId}</td>  {/* ✅ NEW */}
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.password}</td>
              <td>{u.registeredAt.toLocaleString()}</td>
              <td>
                <button className="btn-secondary" disabled>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(u.id)}>
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