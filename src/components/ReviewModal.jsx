import React from 'react';

function ReviewModal({ show, onClose, reservation, onSubmit }) {
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Review Reservation</h2>
        {/* Reservation details */}
        <form onSubmit={onSubmit}>
          {/* Form fields */}
          <button type="submit">Submit</button>
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default ReviewModal;