import React from 'react';

function Header({ user, onLogout, onChangeAvatar }) {
  return (
    <header className="header">
      <a href="#" className="logo">PAUBookit</a>
      <div className="user-info">
        <div className="profile-container">
          <div className="profile-pic">
            <img src="default-avatar.jpg" alt="Profile" />
          </div>
          <button className="change-avatar-btn" onClick={onChangeAvatar}>+</button>
        </div>
        <span id="user-name">{user.name}</span> | ID: <span id="user-id">{user.id}</span>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Header;