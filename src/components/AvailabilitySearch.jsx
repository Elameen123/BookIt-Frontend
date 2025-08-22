import React, { useState } from 'react';

function AvailabilitySearch({ onSearch }) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('ALL');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ date, startTime, endTime, location });
  };

  return (
    <div className="availability-search">
      <h3>Check Classroom Availability</h3>
      <form onSubmit={handleSubmit}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="ALL">All Locations</option>
          <option value="SST">SST</option>
          <option value="TYD">TYD</option>
        </select>
        <button type="submit">Check Availability</button>
      </form>
    </div>
  );
}

export default AvailabilitySearch;