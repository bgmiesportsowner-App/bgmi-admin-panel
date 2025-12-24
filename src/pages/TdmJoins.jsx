// src/pages/TdmJoins.jsx
import { useState } from "react";
import { tdmSample } from "../data/tdmSample";

const TdmJoins = () => {
  const [entries, setEntries] = useState(tdmSample);
  const [form, setForm] = useState({
    playerName: "",
    bgmiId: "",
    device: "Android",
    slot: "",
    status: "Pending"
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.playerName || !form.bgmiId || !form.slot) return;

    const newEntry = {
      id: entries.length + 1,
      ...form,
      joinedAt: new Date().toLocaleString()
    };

    setEntries((prev) => [...prev, newEntry]);
    setForm({
      playerName: "",
      bgmiId: "",
      device: "Android",
      slot: "",
      status: "Pending"
    });
  };

  const handleDelete = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="page">
      <h2 className="page-title">1v1 TDM Join Info</h2>
      <p className="page-subtitle">
        Track all players who registered for 1v1 TDM tournament.
      </p>

      <form className="form-grid" onSubmit={handleAdd}>
        <input
          type="text"
          name="playerName"
          placeholder="Player Name"
          value={form.playerName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="bgmiId"
          placeholder="BGMI ID"
          value={form.bgmiId}
          onChange={handleChange}
        />
        <select name="device" value={form.device} onChange={handleChange}>
          <option>Android</option>
          <option>iOS</option>
        </select>
        <input
          type="text"
          name="slot"
          placeholder="Slot / Match Code"
          value={form.slot}
          onChange={handleChange}
        />
        <select name="status" value={form.status} onChange={handleChange}>
          <option>Pending</option>
          <option>Confirmed</option>
          <option>Rejected</option>
        </select>
        <button className="btn-primary" type="submit">
          + Add Entry
        </button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player Name</th>
            <th>BGMI ID</th>
            <th>Device</th>
            <th>Slot</th>
            <th>Status</th>
            <th>Joined At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, index) => (
            <tr key={e.id}>
              <td>{index + 1}</td>
              <td>{e.playerName}</td>
              <td>{e.bgmiId}</td>
              <td>{e.device}</td>
              <td>{e.slot}</td>
              <td>{e.status}</td>
              <td>{e.joinedAt}</td>
              <td>
                <button className="btn-secondary">Edit</button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(e.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan="8" className="empty-row">
                No TDM joins yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TdmJoins;
