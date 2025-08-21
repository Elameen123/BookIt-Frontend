import React from 'react';

    function ReservationsSection({ reservations }) {
      return (
        <div className="reservations-section">
          <h2>Your Reservations</h2>
          <div className="reminders">
            <h3>Reminders</h3>
            {/* Map reminders */}
          </div>
          <div className="pending">
            <h3>Pending Approval</h3>
            {/* Map pending */}
          </div>
          <div className="approved">
            <h3>Approved</h3>
            {/* Map approved */}
          </div>
          <div className="denied">
            <h3>Denied</h3>
            {/* Map denied */}
          </div>
        </div>
      );
    }

    export default ReservationsSection;