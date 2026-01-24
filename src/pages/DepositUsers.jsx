import { useEffect, useState } from "react";
import "./DepositUsers.css";

/* 🔥 AUTO DETECT - Local + Render Server */
const API =
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://main-server-firebase.onrender.com";

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
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
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

      console.log("🔍 Fetching deposits from:", `${API}/api/admin/deposits`);

      const res = await fetch(`${API}/api/admin/deposits`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error("Failed to fetch deposits");
      }

      setDeposits(data.deposits || []);
      console.log("✅ Deposits loaded:", data.deposits?.length || 0);
    } catch (err) {
      console.error("❌ Deposit load error:", err);
      setError("Server error while loading deposits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  /* ================= APPROVE / REJECT ================= */
  const updateStatus = async (depositId, status) => {
    try {
      const url = `${API}/api/admin/deposit/${depositId}/${status}`;
      console.log("➡️ Updating:", url);

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Status update failed");
      }

      console.log(`✅ ${status.toUpperCase()} SUCCESS`);
      fetchDeposits();
    } catch (err) {
      console.error("❌ Status update error:", err);
      alert("Failed to update status");
    }
  };

  const filteredDeposits = deposits.filter((d) => d.status === filter);

  return (
    <div className="deposit-admin">
      <h2>💰 Deposit Requests</h2>

      {/* FILTER */}
      <div className="deposit-filter">
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={filter === s ? "active" : ""}
          >
            {s.toUpperCase()} ({deposits.filter((d) => d.status === s).length})
          </button>
        ))}
      </div>

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

            {filteredDeposits.map((d) => (
              <tr key={d.id}>
                <td>{d.username || "Player"}</td>
                <td>
                  <strong>{d.profile_id}</strong>
                </td>
                <td>{d.email}</td>
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
