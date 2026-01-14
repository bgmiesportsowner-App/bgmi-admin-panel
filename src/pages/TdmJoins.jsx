// src/pages/TdmJoins.jsx - ✅ PRODUCTION READY + ADMIN PANEL
import { useState, useEffect } from "react";
import "./TdmJoins.css";

const TdmJoins = () => {
  const [tdmEntries, setTdmEntries] = useState([]);
  const [tournamentJoins, setTournamentJoins] = useState([]);
  const [form, setForm] = useState({
    playerName: "", bgmiId: "", device: "Android", slot: "", status: "Pending"
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tdm');

  // 🔥 PRODUCTION BACKEND URL
  const API_URL = 'https://bgmi-api.onrender.com';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // ✅ FIXED: localhost:5001 → PRODUCTION URL
      const response = await fetch(`${API_URL}/api/admin/joins`);
      const data = await response.json();
      setTdmEntries(data.tdmEntries || []);
      setTournamentJoins(data.tournamentJoins || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.playerName || !form.bgmiId || !form.slot) return;

    const newEntry = { id: Date.now().toString(), ...form, joinedAt: new Date().toISOString() };

    try {
      await fetch(`${API_URL}/api/tdm-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      setTdmEntries(prev => [...prev, newEntry]);
      setForm({ playerName: "", bgmiId: "", device: "Android", slot: "", status: "Pending" });
    } catch (error) {
      console.error('TDM save failed');
    }
  };

  // 🔥 FIXED DELETE - CORRECT URL + PRODUCTION
  const handleDelete = async (id, type) => {
    try {
      // ✅ PRODUCTION URL + CORRECT ENDPOINT
      const endpoint = type === 'tdm' ? `/api/admin/tdm/${id}` : `/api/admin/tournament/${id}`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Frontend update
        if (type === 'tdm') {
          setTdmEntries(prev => prev.filter(e => e.id !== id));
        } else {
          setTournamentJoins(prev => prev.filter(e => e.id !== id));
        }
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  if (loading) return <div className="page"><h2 style={{textAlign:'center',padding:'50px'}}>Loading...</h2></div>;

  return (
    <div className="page">
      <h1 className="page-title">👥 Joins Management</h1>
      
      <div className="tab-container">
        <button className={`tab-btn ${activeTab === 'tdm' ? 'active' : ''}`} onClick={() => setActiveTab('tdm')}>
          1v1 TDM ({tdmEntries.length})
        </button>
        <button className={`tab-btn ${activeTab === 'tournament' ? 'active' : ''}`} onClick={() => setActiveTab('tournament')}>
          🏆 Tournaments ({tournamentJoins.length})
        </button>
        <button className="btn-primary refresh-btn" onClick={handleRefresh}>🔄 Refresh</button>
      </div>

      {activeTab === 'tdm' && (
        <>
          <h2 className="page-subtitle">1v1 TDM Join Info</h2>
          <form className="form-grid" onSubmit={handleAdd}>
            <input name="playerName" placeholder="Player Name *" value={form.playerName} onChange={handleChange} required />
            <input name="bgmiId" placeholder="BGMI ID *" value={form.bgmiId} onChange={handleChange} required />
            <select name="device" value={form.device} onChange={handleChange}>
              <option>Android</option><option>iOS</option>
            </select>
            <input name="slot" placeholder="Slot *" value={form.slot} onChange={handleChange} required />
            <select name="status" value={form.status} onChange={handleChange}>
              <option>Pending</option><option>Confirmed</option><option>Rejected</option>
            </select>
            <button className="btn-primary" type="submit">+ Add Entry</button>
          </form>
        </>
      )}

      {activeTab === 'tdm' ? (
        <table className="data-table">
          <thead><tr><th>#</th><th>Player</th><th>BGMI ID</th><th>Device</th><th>Slot</th><th>Status</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {tdmEntries.map((e, index) => (
              <tr key={e.id}>
                <td>{index + 1}</td><td>{e.playerName}</td><td><code>{e.bgmiId}</code></td>
                <td>{e.device}</td><td>{e.slot}</td>
                <td><span className={`status-badge status-${e.status.toLowerCase()}`}>{e.status}</span></td>
                <td>{new Date(e.joinedAt).toLocaleString()}</td>
                <td>
                  <button className="btn-secondary" style={{marginRight: '5px'}}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(e.id, 'tdm')}>🗑️</button>
                </td>
              </tr>
            ))}
            {tdmEntries.length === 0 && <tr><td colSpan="8" className="empty-row">No TDM joins yet</td></tr>}
          </tbody>
        </table>
      ) : (
        <table className="data-table">
          <thead><tr><th>#</th><th>Tournament</th><th>Player</th><th>BGMI ID</th><th>Mode</th><th>Entry</th><th>Prize</th><th>Status</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {tournamentJoins.map((join, index) => (
              <tr key={join.id}>
                <td>{index + 1}</td><td><strong>{join.tournamentName}</strong></td><td>{join.playerName}</td>
                <td><code>{join.bgmiId}</code></td><td>{join.mode}</td><td>₹{join.entryFee}</td>
                <td style={{color:'#28a745'}}>₹{join.prizePool}</td>
                <td><span className="status-badge status-registered">{join.status}</span></td>
                <td>{new Date(join.joinedAt).toLocaleString()}</td>
                <td>
                  <button className="btn-secondary" style={{marginRight: '5px'}}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(join.id, 'tournament')}>🗑️</button>
                </td>
              </tr>
            ))}
            {tournamentJoins.length === 0 && <tr><td colSpan="10" className="empty-row">No tournament registrations yet</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TdmJoins;
