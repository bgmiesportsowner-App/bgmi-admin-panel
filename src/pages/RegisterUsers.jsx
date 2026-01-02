// bgmi-admin-panel/src/pages/RegisterUsers.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

const RegisterUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // users load from backend
  const loadUsers = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await axios.get(`${API_BASE}/admin/users`);
      const list = res.data.map((u, idx) => ({
        id: u.id,
        index: idx + 1,
        profileId: u.profile_id || "-",
        name: u.name || "-",
        email: u.email || "-",
        password: u.password || "****",  // Password field added
        registeredAt: u.created_at
          ? new Date(u.created_at)
          : new Date(),
      }));
      setUsers(list);
    } catch (err) {
      console.error("Load users error:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      setError("");
      await axios.delete(`${API_BASE}/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Delete user error:", err);
      setError("Error while deleting user");
    }
  };

  return (
    <div className="page">
      <h2 className="page-title">Register Users</h2>
      <p className="page-subtitle">
        Add new BGMI players, view their details and manage registrations.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="alert alert-info">Loading users...</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Profile ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Password</th>  {/* New Password column */}
            <th>Register Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.index}</td>
              <td>{u.profileId}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.password}</td>  {/* Password display */}
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
              <td colSpan="7" className="empty-row">  {/* colspan 7 now */}
                No users yet. Ask players to register from BGMI app.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RegisterUsers;
