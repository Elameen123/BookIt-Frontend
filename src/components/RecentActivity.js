import React from 'react';

function RecentActivity({ activities }) {
  return (
    <div className="recent-activity">
      <h2>Recent Activity</h2>
      <div className="activity-list">
        {activities.map(activity => (
          <div key={activity.id} className="activity-item">
            {/* Activity details */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentActivity;