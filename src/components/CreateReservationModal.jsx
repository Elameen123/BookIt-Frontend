import React from 'react';

function CreateReservationModal({ show, onClose, onSubmit }) {
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Create Reservation</h2>
        <form onSubmit={onSubmit}>
          {/* Form fields */}
          <button type="submit">Confirm Booking</button>
        </form>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default CreateReservationModal;