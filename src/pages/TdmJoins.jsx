import { useState, useEffect, useCallback } from "react";
import "./TdmJoins.css";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5002"
    : "https://bgmi-server-save-tournament-data.onrender.com";

const TdmJoins = () => {
  const [joins, setJoins] = useState([]);
  const [rooms, setRooms] = useState({}); // ✅ EMPTY ON LOAD
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (saving) return;

    try {
      console.log("🔄 Fetching from:", API_URL);
      const res = await fetch(`${API_URL}/api/admin/joins`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log("📥 Data received:", data.tournamentJoins);
      
      setJoins(data.tournamentJoins || []);

      // 🔥 FIXED: FORCE EMPTY ROOMS EVERY TIME (not just first load)
      const map = {};
      data.tournamentJoins.forEach(j => {
        map[j.tournament_id] = {
          roomId: "",        // ✅ ALWAYS EMPTY
          roomPassword: ""   // ✅ ALWAYS EMPTY
        };
      });
      
      console.log("🏠 Rooms map FORCED EMPTY:", map);
      setRooms(map); // ✅ OVERWRITE - no prev check
    } catch (error) {
      console.error("❌ Fetch error:", error);
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

  const saveRoom = async (tournamentId) => {
    setSaving(true);
    setMessage("");

    try {
      const roomData = rooms[tournamentId];
      if (!roomData || (!roomData.roomId && !roomData.roomPassword)) {
        setMessage("❌ Enter Room ID or Password first");
        return;
      }

      console.log("📤 Saving:", { tournamentId, ...roomData });
      
      const res = await fetch(`${API_URL}/api/admin/set-room-by-tournament`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          ...roomData
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Save success:", data);
      setMessage(`✅ ${data.message || "Room saved successfully"}`);
    } catch (error) {
      console.error("❌ Save error:", error);
      setMessage(`❌ Save failed: ${error.message}`);
    } finally {
      setSaving(false);
      fetchData(); // ✅ REFRESH - inputs will be EMPTY again
    }
  };

  const clearRoom = async (tournamentId) => {
    setSaving(true);
    setMessage("");

    try {
      console.log("🧹 Clearing:", tournamentId);
      
      const res = await fetch(`${API_URL}/api/admin/set-room-by-tournament`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setMessage("🧹 Room cleared");
    } catch (error) {
      console.error("❌ Clear error:", error);
      setMessage("❌ Clear failed");
    } finally {
      setSaving(false);
      fetchData(); // ✅ REFRESH - inputs EMPTY
    }
  };

  const deleteUser = async (id) => {
    setMessage("");

    try {
      console.log("🗑️ Deleting:", id);
      
      const res = await fetch(`${API_URL}/api/admin/tournament/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setMessage("🗑️ User deleted");
      fetchData();
    } catch (error) {
      console.error("❌ Delete error:", error);
      setMessage("❌ Delete failed");
    }
  };

  if (loading) return <h2 style={{ padding: 30, textAlign: 'center' }}>Loading...</h2>;

  return (
    <div className="page">
      <h1>🏆 Tournament Joins (Admin)</h1>

      {message && (
        <div className="admin-message">
          {message}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Profile Name</th>
            <th>Profile ID</th>
            <th>Tournament</th>
            <th>Player Name</th>
            <th>BGMI ID</th>
            <th>Entry</th>
            <th>Prize</th>
            <th>Mode</th>
            <th>Map</th>
            <th>Room ID</th>
            <th>Room Pass</th>
            <th>Date</th>
            <th>Save</th>
            <th>Clear</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {joins.map((j, i) => (
            <tr key={j.id}>
              <td>{i + 1}</td>
              <td>{j.profile_name || 'N/A'}</td>
              <td>{j.profile_id || 'N/A'}</td>
              <td>{j.tournament_name || 'N/A'}</td>
              <td>{j.player_name || 'N/A'}</td>
              <td>{j.bgmi_id || 'N/A'}</td>
              <td>₹{j.entry_fee || 0}</td>
              <td>₹{j.prize_pool || 0}</td>
              <td>{j.mode || 'TDM'}</td>
              <td>{j.map || 'Erangel'}</td>
              
              {/* ✅ Room ID - GUARANTEED EMPTY */}
              <td>
                <input
                  value={rooms[j.tournament_id]?.roomId || ""}
                  onChange={e =>
                    setRooms(r => ({
                      ...r,
                      [j.tournament_id]: {
                        ...r[j.tournament_id],
                        roomId: e.target.value
                      }
                    }))
                  }
                  placeholder="Room ID"
                  disabled={saving}
                  style={{ padding: '4px 8px', minWidth: '90px', fontSize: '12px' }}
                />
              </td>

              {/* ✅ Room Password - GUARANTEED EMPTY */}
              <td>
                <input
                  type="password"
                  value={rooms[j.tournament_id]?.roomPassword || ""}
                  onChange={e =>
                    setRooms(r => ({
                      ...r,
                      [j.tournament_id]: {
                        ...r[j.tournament_id],
                        roomPassword: e.target.value
                      }
                    }))
                  }
                  placeholder="Pass"
                  disabled={saving}
                  style={{ padding: '4px 8px', minWidth: '90px', fontSize: '12px' }}
                />
              </td>

              <td>{j.joined_at ? new Date(j.joined_at).toLocaleString('en-IN') : 'N/A'}</td>
              
              <td>
                <button 
                  onClick={() => saveRoom(j.tournament_id)}
                  disabled={saving}
                  style={{ 
                    padding: '4px 8px', margin: '1px', fontSize: '12px',
                    background: '#4CAF50', color: 'white', border: 'none',
                    borderRadius: '3px', cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  💾
                </button>
              </td>
              
              <td>
                <button 
                  onClick={() => clearRoom(j.tournament_id)}
                  disabled={saving}
                  style={{ 
                    padding: '4px 8px', margin: '1px', fontSize: '12px',
                    background: '#ff9800', color: 'white', border: 'none',
                    borderRadius: '3px', cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  🧹
                </button>
              </td>
              
              <td>
                <button 
                  onClick={() => deleteUser(j.id)}
                  disabled={saving}
                  style={{ 
                    padding: '4px 8px', margin: '1px', fontSize: '12px',
                    background: '#f44336', color: 'white', border: 'none',
                    borderRadius: '3px', cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}

          {joins.length === 0 && (
            <tr>
              <td colSpan="16" style={{ textAlign: "center", padding: '20px', color: '#666' }}>
                📭 No tournament joins found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <details>
          <summary>🔍 Debug Info</summary>
          <pre>{JSON.stringify({ 
            totalJoins: joins.length, 
            roomsCount: Object.keys(rooms).length,
            sampleData: joins[0] || 'No data'
          }, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
};

export default TdmJoins;
