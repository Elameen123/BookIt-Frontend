import React from 'react';

function Alert({ message }) {
  return (
    <div className="alert-popup">
      <div className="alert-content">
        <p>{message}</p>
      </div>
    </div>
  );
}

export default Alert;