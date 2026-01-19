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
          📊 Dashboard
        </NavLink>

        <NavLink to="/register-users" className="nav-item">
          👤 Register Users
        </NavLink>

        <NavLink to="/rooms" className="nav-item">
          🎮 1v1 Room ID & Password
        </NavLink>

        <NavLink to="/tdm-joins" className="nav-item">
          ⚔️ 1v1 TDM Joins
        </NavLink>

        <NavLink to="/deposit-users" className="nav-item">
          💰 Deposit Users
        </NavLink>

        <NavLink to="/settings" className="nav-item">
          ⚙️ Settings
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
