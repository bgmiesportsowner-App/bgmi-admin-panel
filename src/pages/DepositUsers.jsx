import { useEffect, useState } from "react";
import "./DepositUsers.css";

const API = "http://localhost:5001";  // ✅ FIXED: Port 5001

const DepositUsers = () => {
  const [deposits, setDeposits] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FORMAT DATE FUNCTION ================= */
  const formatIndianDate = (dateString) => {
    if (!dateString) return "-";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  /* ================= FETCH DEPOSITS ================= */
  const fetchDeposits = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/admin/deposits`);  // ✅ Backend endpoint
      const data = await res.json();

      if (!res.ok) {
        throw new Error("Failed to fetch deposits");
      }

      console.log("📥 Admin deposits loaded:", data.deposits);
      setDeposits(data.deposits || []);
    } catch (err) {
      console.error(err);
      setError("Server error while loading deposits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  /* ================= APPROVE/REJECT DEPOSIT ================= */
  const updateStatus = async (depositId, status) => {
    try {
      const res = await fetch(`${API}/api/admin/deposit/${depositId}/${status}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Status update failed");
      }

      console.log(`✅ ${status.toUpperCase()} - Deposit ID: ${depositId}`);
      fetchDeposits();  // Refresh list
    } catch (err) {
      alert("Failed to update status");
      console.error(err);
    }
  };

  const filteredDeposits = deposits.filter(d => d.status === filter);

  return (
    <div className="deposit-admin">
      <h2>💰 Deposit Requests</h2>

      {/* FILTER BUTTONS */}
      <div className="deposit-filter">
        {["pending", "approved", "rejected"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={filter === s ? "active" : ""}
          >
            {s.toUpperCase()} ({deposits.filter(d => d.status === s).length})
          </button>
        ))}
      </div>

      {/* STATES */}
      {loading && <p style={{ textAlign: "center" }}>Loading deposits...</p>}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {!loading && !error && (
        <table className="deposit-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Profile ID</th>
              <th>Email</th>
              <th>Amount</th>
              <th>UTR</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDeposits.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No {filter} deposits found
                </td>
              </tr>
            )}

            {filteredDeposits.map(d => (
              <tr key={d.id}>  {/* ✅ d.id use karo */}
                <td>{d.username || "Player"}</td>
                <td>
                  <strong>{d.profile_id || d.profileId}</strong>
                </td>
                <td>{d.email || "-"}</td>
                <td>₹{d.amount}</td>
                <td>{d.utr}</td>
                <td>{formatIndianDate(d.createdAt)}</td>
                <td>
                  <span className={`status ${d.status}`}>
                    {d.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  {d.status === "pending" ? (
                    <>
                      <button
                        className="approve"
                        onClick={() => updateStatus(d.id, "approve")}
                      >
                        ✅ Approve
                      </button>
                      <br />
                      <button
                        className="reject"
                        onClick={() => updateStatus(d.id, "reject")}
                      >
                        ❌ Reject
                      </button>
                    </>
                  ) : (
                    <small>—</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DepositUsers;
