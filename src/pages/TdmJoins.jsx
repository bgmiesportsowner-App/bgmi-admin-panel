import { useState, useEffect, useCallback } from "react";
import "./TdmJoins.css";

// 🔥 PERFECT! Local + Render Auto-detect
const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5002"
    : "https://bgmi-server-save-tournament-data.onrender.com";

const TdmJoins = () => {
  const [joins, setJoins] = useState([]);
  const [rooms, setRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (saving) return;

    try {
      console.log("🔄 Fetching from:", API_URL); // Debug
      const res = await fetch(`${API_URL}/api/admin/joins`);
      const data = await res.json();

      setJoins(data.tournamentJoins || []);

      const map = {};
      data.tournamentJoins.forEach(j => {
        if (!map[j.tournamentId]) {
          map[j.tournamentId] = {
            roomId: j.roomId || "",
            roomPassword: j.roomPassword || ""
          };
        }
      });

      setRooms(prev => (Object.keys(prev).length ? prev : map));
    } catch {
      setMessage("❌ Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [saving]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 10000);
    return () => clearInterval(i);
  }, [fetchData]);

  /* ================= SAVE ROOM ================= */
  const saveRoom = async (tournamentId) => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(
        `${API_URL}/api/admin/set-room-by-tournament`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournamentId,
            ...rooms[tournamentId]
          })
        }
      );

      const data = await res.json();
      setMessage(`✅ ${data.message}`);
    } catch {
      setMessage("❌ Save failed");
    } finally {
      setSaving(false);
      fetchData();
    }
  };

  /* ================= CLEAR ROOM ================= */
  const clearRoom = async (tournamentId) => {
    setSaving(true);
    setMessage("");

    try {
      await fetch(`${API_URL}/api/admin/set-room-by-tournament`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId })
      });

      setRooms(prev => ({
        ...prev,
        [tournamentId]: { roomId: "", roomPassword: "" }
      }));

      setMessage("🧹 Room cleared");
    } catch {
      setMessage("❌ Clear failed");
    } finally {
      setSaving(false);
      fetchData();
    }
  };

  /* ================= DELETE USER ================= */
  const deleteUser = async (id) => {
    setMessage("");

    try {
      await fetch(`${API_URL}/api/admin/tournament/${id}`, {
        method: "DELETE"
      });

      setMessage("🗑️ User deleted");
      fetchData();
    } catch {
      setMessage("❌ Delete failed");
    }
  };

  if (loading) return <h2 style={{ padding: 30 }}>Loading...</h2>;

  return (
    <div className="page">
      <h1>🏆 Tournament Joins (Admin)</h1>

      {/* ✅ ADMIN PANEL MESSAGE */}
      {message && (
        <div className="admin-message">
          {message}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Profil_Name:</th>
            <th>Profile_ID:</th>
            <th>Tournament_Name:</th>
            <th>BGMI_Name:</th>
            <th>BGMI ID:</th>
            <th>Room ID</th>
            <th>Room_Password:</th>
            <th>Date & Time</th>
            <th>Save</th>
            <th>Clear</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {joins.map((j, i) => (
            <tr key={j.id}>
              <td>{i + 1}</td>
              <td>{j.tournamentName}</td>
              <td>{j.playerName}</td>
              <td>{j.bgmiId}</td>

              <td>
                <input
                  value={rooms[j.tournamentId]?.roomId || ""}
                  onChange={e =>
                    setRooms(r => ({
                      ...r,
                      [j.tournamentId]: {
                        ...r[j.tournamentId],
                        roomId: e.target.value
                      }
                    }))
                  }
                />
              </td>

              <td>
                <input
                  value={rooms[j.tournamentId]?.roomPassword || ""}
                  onChange={e =>
                    setRooms(r => ({
                      ...r,
                      [j.tournamentId]: {
                        ...r[j.tournamentId],
                        roomPassword: e.target.value
                      }
                    }))
                  }
                />
              </td>

              <td>
                <button onClick={() => saveRoom(j.tournamentId)}>
                  💾
                </button>
              </td>

              <td>
                <button onClick={() => clearRoom(j.tournamentId)}>
                  ❌
                </button>
              </td>

              <td>
                <button onClick={() => deleteUser(j.id)}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}

          {joins.length === 0 && (
            <tr>
              <td colSpan="9" style={{ textAlign: "center" }}>
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TdmJoins;
