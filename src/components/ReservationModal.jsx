import React from 'react';

function ReservationModal({ show, onClose, onSubmit }) {
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Reserve Classroom</h2>
        <form onSubmit={onSubmit}>
          {/* Form fields from HTML */}
          <button type="submit">Submit Reservation Request</button>
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default ReservationModal;