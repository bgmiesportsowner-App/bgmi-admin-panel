// src/pages/RoomManagement.jsx
import { useState } from "react";
import { roomsSample } from "../data/roomsSample";

const RoomManagement = () => {
  const [rooms, setRooms] = useState(roomsSample);
  const [form, setForm] = useState({
    roomId: "",
    password: "",
    type: "1v1 TDM",
    map: "Warehouse",
    time: ""
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddRoom = (e) => {
    e.preventDefault();
    if (!form.roomId || !form.password || !form.time) return;

    const newRoom = {
      id: rooms.length + 1,
      ...form
    };
    setRooms((prev) => [...prev, newRoom]);
    setForm({
      roomId: "",
      password: "",
      type: "1v1 TDM",
      map: "Warehouse",
      time: ""
    });
  };

  const handleDelete = (id) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="page">
      <h2 className="page-title">1v1 Room ID & Password</h2>
      <p className="page-subtitle">
        Create and update custom rooms for BGMI 1v1 / classic matches.
      </p>

      <form className="form-grid" onSubmit={handleAddRoom}>
        <input
          type="text"
          name="roomId"
          placeholder="Room ID"
          value={form.roomId}
          onChange={handleChange}
        />
        <input
          type="text"
          name="password"
          placeholder="Room Password"
          value={form.password}
          onChange={handleChange}
        />
        <select name="type" value={form.type} onChange={handleChange}>
          <option>1v1 TDM</option>
          <option>Custom Classic</option>
          <option>Squad Scrims</option>
        </select>
        <select name="map" value={form.map} onChange={handleChange}>
          <option>Warehouse</option>
          <option>Erangel</option>
          <option>Miramar</option>
          <option>Livik</option>
        </select>
        <input
          type="datetime-local"
          name="time"
          value={form.time}
          onChange={handleChange}
        />
        <button className="btn-primary" type="submit">
          + Create Room
        </button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Room ID</th>
            <th>Password</th>
            <th>Type</th>
            <th>Map</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r, index) => (
            <tr key={r.id}>
              <td>{index + 1}</td>
              <td>{r.roomId}</td>
              <td>{r.password}</td>
              <td>{r.type}</td>
              <td>{r.map}</td>
              <td>{r.time}</td>
              <td>
                <button className="btn-secondary">Edit</button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(r.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {rooms.length === 0 && (
            <tr>
              <td colSpan="7" className="empty-row">
                No rooms created yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RoomManagement;
