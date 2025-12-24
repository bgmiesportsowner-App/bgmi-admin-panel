import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-main">BGMI</span>
        <span className="logo-sub">Hacker Admin</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className="nav-item">
          <span>📊 Dashboard</span>
        </NavLink>

        <NavLink to="/register-users" className="nav-item">
          <span>👤 Register Users</span>
        </NavLink>

        <NavLink to="/rooms" className="nav-item">
          <span>🎮 1v1 Room ID & Password</span>
        </NavLink>

        <NavLink to="/tdm-joins" className="nav-item">
          <span>⚔️ 1v1 TDM Joins</span>
        </NavLink>

        <NavLink to="/settings" className="nav-item">
          <span>⚙️ Settings</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
