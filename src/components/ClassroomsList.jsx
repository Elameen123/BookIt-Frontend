import React from 'react';

function ClassroomsList({ classrooms, filterStatus, locationStatus }) {
  return (
    <div className="classrooms-section">
      <div className="location-title">
        <h2>Available Classrooms</h2>
        <span className="location-status">{locationStatus}</span>
      </div>
      <div className="classrooms-grid">
        {classrooms.map((room, index) => (
          <div key={index} className="classroom-card">
            {/* Room details */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClassroomsList;