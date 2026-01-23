import { useEffect, useState } from "react";
import axios from "axios";

// 🔥 AUTO DETECT - Local + Render Server (Consistent pattern)
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://main-server-firebase.onrender.com";

const RegisterUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ===============================
     LOAD USERS FROM BGMI SERVER
  =============================== */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔍 Loading BGMI users from:", `${API_BASE}/api/admin/users`);
      
      const res = await axios.get(`${API_BASE}/api/admin/users`);
      
      const list = res.data.users.map((u, idx) => ({
        id: u.id,
        index: idx + 1,
        profileId: u.profile_id,      // BGMI-10001
        name: u.username,             // Akash  
        email: u.email,               // wegab86429@lawicon.com
        balance: u.balance || 0,      // 0
        registeredAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      }));

      setUsers(list);
      console.log("✅ ADMIN USERS LOADED:", list.length, "users");
      
    } catch (err) {
      console.error("❌ Load users error:", err.response?.data || err.message);
      setError(`Failed to load users: ${err.response?.status || 'Check backend server'}`);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     DELETE USER - ESLint FIXED
  =============================== */
  const handleDelete = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Delete this BGMI player permanently?")) return;
    
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${id}`);
      loadUsers();
      console.log("🗑️ User deleted:", id);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Delete failed - try again");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">👥 BGMI Esports – Registered Players</h2>
        <p className="page-subtitle">
          Admin View - {users.length} Players Total
        </p>
        <button 
          onClick={loadUsers} 
          className="btn-refresh"
          style={{
            padding: '8px 16px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{
          background: '#fee',
          color: '#c53030',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          borderLeft: '4px solid #f56565'
        }}>
          ❌ {error}
          <br />
          <small>Make sure BGMI backend is running</small>
        </div>
      )}

      {loading && (
        <div className="alert alert-info" style={{
          background: '#ebf8ff',
          color: '#2c5282',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          ⏳ Loading registered BGMI players...
        </div>
      )}

      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <thead style={{ background: '#f7fafc' }}>
            <tr>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>#</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Profile ID</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Balance</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Register Time</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{
                borderBottom: '1px solid #e2e8f0'
              }}>
                <td style={{ padding: '12px 8px', fontWeight: '500' }}>{u.index}</td>
                <td style={{ padding: '12px 8px' }}>
                  <strong style={{ 
                    color: '#ff4444', 
                    fontFamily: 'monospace',
                    background: '#fff5f5',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {u.profileId}
                  </strong>
                </td>
                <td style={{ padding: '12px 8px', fontWeight: '600' }}>{u.name}</td>
                <td style={{ padding: '12px 8px' }}>
                  <small style={{ color: '#666' }}>{u.email}</small>
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: u.balance > 0 ? '#38a169' : '#666'
                }}>
                  ₹{u.balance.toLocaleString()}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <small style={{ color: '#666' }}>
                    {u.registeredAt.toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </small>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <button 
                    className="btn-secondary" 
                    disabled 
                    title="Coming soon"
                    style={{
                      padding: '6px 12px',
                      marginRight: '4px',
                      background: '#cbd5e0',
                      color: '#4a5568',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(u.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#f56565',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-row" style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: '#a0aec0'
                }}>
                  <div>
                    👥 No BGMI players registered yet
                    <br />
                    <small style={{ fontSize: '14px' }}>
                      Players will appear here after registration from frontend
                    </small>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegisterUsers;
