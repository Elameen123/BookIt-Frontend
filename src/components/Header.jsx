import React from 'react';

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <a href="#" className="logo">PAUBookit Admin</a>
      <div className="user-info">
        Hello, {user.name} | Role: Administrator
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Header;