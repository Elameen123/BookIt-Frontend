import React from 'react';

function ReservationManagement({ filters, onFilterChange, stats, reservations, onCreate, onReview, onConfirm }) {
  return (
    <div className="main-content">
      <div className="control-panel">
        <div className="panel-header">
          <h2>Reservation Management</h2>
          <button onClick={onCreate} className="create-btn">Create Reservation</button>
        </div>
        <div className="filter-controls">
          {/* Filter inputs */}
          <button onClick={() => onFilterChange(filters)}>Apply Filters</button>
          <button onClick={() => onFilterChange({ status: 'all', date: '', location: 'all' })}>Clear Filters</button>
        </div>
      </div>
      <div className="stats-grid">
        {/* Stat cards */}
      </div>
      <div className="pending-reservations">
        <div className="table-header">
          <h3>Pending Reservations</h3>
          <div>
            <button onClick={() => {}}>Refresh</button>
            <button onClick={() => {}}>Export</button>
          </div>
        </div>
        <table className="reservations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requestor</th>
              <th>Classroom</th>
              <th>Date</th>
              <th>Time</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(res => (
              <tr key={res.id}>
                <td>{res.id}</td>
                {/* Fill other cells */}
                <td>
                  <button onClick={() => onReview(res)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReservationManagement;