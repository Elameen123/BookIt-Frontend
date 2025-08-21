import React from 'react';

function AvatarModal({ show, onClose, onUpload }) {
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Change Profile Picture</h2>
        <form onSubmit={onUpload}>
          <input type="file" accept="image/*" />
          <button type="submit">Upload</button>
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default AvatarModal;