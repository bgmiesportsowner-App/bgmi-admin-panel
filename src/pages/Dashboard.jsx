// src/pages/Dashboard.jsx
import CardStat from "../components/CardStat";
import { usersSample } from "../data/usersSample";
import { roomsSample } from "../data/roomsSample";
import { tdmSample } from "../data/tdmSample";

const Dashboard = () => {
  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>
      <p className="page-subtitle">
        Welcome to the BGMI hacker-style admin console. Control all users,
        rooms and TDM joins from here.
      </p>

      <div className="stat-grid">
        <CardStat label="Total Users" value={usersSample.length} accent="green" />
        <CardStat label="Active Rooms" value={roomsSample.length} accent="cyan" />
        <CardStat label="TDM Joins" value={tdmSample.length} accent="purple" />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h3>Recent Users</h3>
          <ul className="simple-list">
            {usersSample.slice(0, 5).map((u) => (
              <li key={u.id}>
                <span>{u.profileId}</span>
                <span>{u.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dashboard-panel">
          <h3>Upcoming Rooms</h3>
          <ul className="simple-list">
            {roomsSample.slice(0, 5).map((r) => (
              <li key={r.id}>
                <span>{r.roomId}</span>
                <span>{r.map}</span>
                <span>{r.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;