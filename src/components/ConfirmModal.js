import React from 'react';

function ConfirmModal({ show, onClose, onConfirm, action, data }) {
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Confirm Action</h2>
        <p>Are you sure you want to proceed with this action?</p>
        {data && <p>Data: {JSON.stringify(data)}</p>} {/* Optional: Display data */}
        <button onClick={onConfirm}>Proceed</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default ConfirmModal;
