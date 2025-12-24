// src/components/Topbar.jsx
const Topbar = () => {
  const now = new Date().toLocaleString();

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">BGMI Esports Control Room</h1>
        <span className="topbar-subtitle">Admin Panel • Hacker Mode</span>
      </div>
      <div className="topbar-right">
        <span className="topbar-time">{now}</span>
        <span className="topbar-badge">ADMIN</span>
      </div>
    </div>
  );
};

export default Topbar;
