// src/pages/TdmJoins.jsx - 100% WORKING
import { useState, useEffect } from "react";
import "./TdmJoins.css";

const TdmJoins = () => {
  const [tournamentJoins, setTournamentJoins] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 PRODUCTION BACKEND URL
  const API_URL = 'https://bgmi-api.onrender.com';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // ✅ CORRECT ENDPOINT
      const response = await fetch(`${API_URL}/api/admin/joins`);
      const data = await response.json();
      
      // 🔥 FIXED: Sirf tournamentJoins use karo
      console.log('🔍 API Response:', data);
      setTournamentJoins(data.tournamentJoins || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED DELETE - CORRECT URL
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tournament/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTournamentJoins(prev => prev.filter(e => e.id !== id));
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
      <h1 className="page-title">🏆 Tournament Joins</h1>
      
      <div className="tab-container">
        <button className="btn-primary refresh-btn" onClick={handleRefresh}>🔄 Refresh</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tournament</th>
            <th>Player</th>
            <th>BGMI ID</th>
            <th>Mode</th>
            <th>Entry</th>
            <th>Prize</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tournamentJoins.map((join, index) => (
            <tr key={join.id}>
              <td>{index + 1}</td>
              <td><strong>{join.tournamentName}</strong></td>
              <td>{join.playerName}</td>
              <td><code>{join.bgmiId}</code></td>
              <td>{join.mode}</td>
              <td>₹{join.entryFee}</td>
              <td style={{color:'#28a745'}}>₹{join.prizePool}</td>
              <td>{join.date}</td>
              <td>{join.time}</td>
              <td><span className="status-badge status-registered">{join.status}</span></td>
              <td>{new Date(join.joinedAt).toLocaleString()}</td>
              <td>
                <button className="btn-secondary" style={{marginRight: '5px'}}>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(join.id)}>🗑️</button>
              </td>
            </tr>
          ))}
          {tournamentJoins.length === 0 && (
            <tr>
              <td colSpan="12" className="empty-row">No tournament registrations yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TdmJoins;
