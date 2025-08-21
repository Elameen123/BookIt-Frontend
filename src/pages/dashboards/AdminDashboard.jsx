import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ReservationManagement from '../components/ReservationManagement';
import RecentActivity from '../components/RecentActivity';
import ReviewModal from '../components/ReviewModal';
import CreateReservationModal from '../components/CreateReservationModal';
import ConfirmModal from '../components/ConfirmModal';
import Alert from '../components/Alert';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const [reservations, setReservations] = useState({
    pending: [],
    approved: [],
    denied: [],
    all: [],
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    denied: 0,
    total: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null); // Added confirmData state
  const [alertMessage, setAlertMessage] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    location: 'all',
  });

  useEffect(() => {
    if (loading) return;
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }

    initializeSharedStorage();
    loadReservations();
    updateStats();
    updateRecentActivity();
  }, [currentUser, loading, navigate, filters]);

  const initializeSharedStorage = () => {
    if (!localStorage.getItem('classroomReservations')) {
      const initialReservations = {
        pending: [],
        approved: [],
        denied: [],
        lastUpdate: new Date().getTime()
      };
      localStorage.setItem('classroomReservations', JSON.stringify(initialReservations));
    }
  };

  const loadReservations = () => {
    const res = JSON.parse(localStorage.getItem('classroomReservations')) || {};
    setReservations(res);
  };

  const updateStats = () => {
    setStats({
      pending: reservations.pending.length,
      approved: reservations.approved.length,
      denied: reservations.denied.length,
      total: reservations.pending.length + reservations.approved.length + reservations.denied.length,
    });
  };

  const updateRecentActivity = () => {
    const activities = JSON.parse(localStorage.getItem('recentActivities')) || [];
    setRecentActivities(activities.slice(0, 5));
  };

  const showAlert = (message) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(''), 3000);
  };

  if (loading || !currentUser) return null;

  return (
    <div>
      <Header user={currentUser} onLogout={() => navigate('/login')} />
      <div className="dashboard-container">
        <ReservationManagement 
          filters={filters}
          onFilterChange={setFilters}
          stats={stats}
          reservations={reservations[filters.status] || reservations.all}
          onCreate={() => setShowCreateModal(true)}
          onReview={(res) => { setSelectedReservation(res); setShowReviewModal(true); }}
          onConfirm={(action, data) => { setConfirmAction(action); setConfirmData(data); setShowConfirmModal(true); }}
        />
        <RecentActivity activities={recentActivities} />
      </div>
      <ReviewModal 
        show={showReviewModal} 
        onClose={() => setShowReviewModal(false)} 
        reservation={selectedReservation} 
        onSubmit={() => {}} 
      />
      <CreateReservationModal 
        show={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSubmit={() => {}} 
      />
      <ConfirmModal 
        show={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)} 
        onConfirm={() => {}} 
        action={confirmAction}
        data={confirmData} // Pass confirmData to modal
      />
      {alertMessage && <Alert message={alertMessage} />}
    </div>
  );
}

export default AdminDashboard;
