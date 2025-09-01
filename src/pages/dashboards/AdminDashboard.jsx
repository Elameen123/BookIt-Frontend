import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import ReservationManagement from '../../components/ReservationManagement';
import RecentActivity from '../../components/RecentActivity';
import ReviewModal from '../../components/ReviewModal';
import CreateReservationModal from '../../components/CreateReservationModal';
import ConfirmModal from '../../components/ConfirmModal';
import Alert from '../../components/Alert';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import './AdminDashboard.css'; // Same folder

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
  const [confirmData, setConfirmData] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    location: 'all',
  });

  // Initialize shared storage - only runs once
  const initializeSharedStorage = useCallback(() => {
    if (!localStorage.getItem('classroomReservations')) {
      const initialReservations = {
        pending: [],
        approved: [],
        denied: [],
        lastUpdate: new Date().getTime()
      };
      localStorage.setItem('classroomReservations', JSON.stringify(initialReservations));
    }
  }, []);

  // Load reservations from storage
  const loadReservations = useCallback(() => {
    const res = JSON.parse(localStorage.getItem('classroomReservations')) || {
      pending: [],
      approved: [],
      denied: [],
      all: []
    };
    
    // Combine all reservations for 'all' filter
    res.all = [...(res.pending || []), ...(res.approved || []), ...(res.denied || [])];
    setReservations(res);
  }, []);

  // Load recent activities from storage
  const loadRecentActivities = useCallback(() => {
    const activities = JSON.parse(localStorage.getItem('recentActivities')) || [];
    setRecentActivities(activities.slice(0, 5));
  }, []);

  // Show alert message
  const showAlert = useCallback((message) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(''), 3000);
  }, []);

  // Add activity to recent activities
  const addRecentActivity = useCallback((activity) => {
    const activities = JSON.parse(localStorage.getItem('recentActivities')) || [];
    const newActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Admin',
      ...activity
    };
    
    activities.unshift(newActivity);
    localStorage.setItem('recentActivities', JSON.stringify(activities.slice(0, 50))); // Keep last 50
    
    // Update state directly instead of calling loadRecentActivities to avoid loops
    setRecentActivities(activities.slice(0, 5));
  }, [currentUser]);

  // Handle reservation review submission
  const handleReviewSubmit = useCallback(async (reviewData) => {
    try {
      if (!selectedReservation) return;

      const reservationData = JSON.parse(localStorage.getItem('classroomReservations')) || {
        pending: [],
        approved: [],
        denied: []
      };

      // Remove from pending
      reservationData.pending = reservationData.pending.filter(r => r.id !== selectedReservation.id);

      // Update reservation with review data
      const updatedReservation = {
        ...selectedReservation,
        ...reviewData,
        reviewedBy: currentUser.id,
        reviewedAt: new Date().toISOString()
      };

      // Add to appropriate list based on status
      if (reviewData.status === 'approved') {
        reservationData.approved.push(updatedReservation);
      } else if (reviewData.status === 'denied') {
        reservationData.denied.push(updatedReservation);
      }

      // Update storage
      localStorage.setItem('classroomReservations', JSON.stringify(reservationData));

      // Add to recent activity
      addRecentActivity({
        action: reviewData.status === 'approved' ? 'approved' : 'denied',
        type: 'reservation',
        description: `${reviewData.status === 'approved' ? 'Approved' : 'Denied'} reservation for ${selectedReservation.classroom}`,
        reservationId: selectedReservation.id
      });

      // Refresh data
      loadReservations();
      setShowReviewModal(false);
      setSelectedReservation(null);
      showAlert(`Reservation ${reviewData.status} successfully`);

    } catch (error) {
      console.error('Error reviewing reservation:', error);
      showAlert('Error processing reservation review');
    }
  }, [selectedReservation, currentUser, loadReservations, showAlert, addRecentActivity]);

  // Handle create reservation submission
  const handleCreateSubmit = useCallback(async (reservationData) => {
    try {
      const existingReservations = JSON.parse(localStorage.getItem('classroomReservations')) || {
        pending: [],
        approved: [],
        denied: []
      };

      const newReservation = {
        id: Date.now(),
        ...reservationData,
        status: 'approved', // Admin-created reservations are auto-approved
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        isAdminCreated: true
      };

      existingReservations.approved.push(newReservation);
      localStorage.setItem('classroomReservations', JSON.stringify(existingReservations));

      // Add to recent activity
      addRecentActivity({
        action: 'created',
        type: 'reservation',
        description: `Created reservation for ${reservationData.classroom}`,
        reservationId: newReservation.id
      });

      loadReservations();
      setShowCreateModal(false);
      showAlert('Reservation created successfully');

    } catch (error) {
      console.error('Error creating reservation:', error);
      showAlert('Error creating reservation');
    }
  }, [currentUser, loadReservations, showAlert, addRecentActivity]);

  // Handle confirm action
  const handleConfirmAction = useCallback(async () => {
    try {
      if (!confirmAction || !confirmData) return;

      const reservationData = JSON.parse(localStorage.getItem('classroomReservations')) || {
        pending: [],
        approved: [],
        denied: []
      };

      if (confirmAction === 'delete') {
        // Remove from all lists
        ['pending', 'approved', 'denied'].forEach(status => {
          reservationData[status] = reservationData[status].filter(r => r.id !== confirmData.id);
        });

        addRecentActivity({
          action: 'deleted',
          type: 'reservation',
          description: `Deleted reservation for ${confirmData.classroom}`,
          reservationId: confirmData.id
        });

        showAlert('Reservation deleted successfully');

      } else if (confirmAction === 'bulk_approve') {
        // Move all pending to approved
        reservationData.approved.push(...reservationData.pending.map(r => ({
          ...r,
          status: 'approved',
          reviewedBy: currentUser.id,
          reviewedAt: new Date().toISOString()
        })));
        reservationData.pending = [];

        addRecentActivity({
          action: 'bulk_approved',
          type: 'reservation',
          description: `Bulk approved ${confirmData.count} reservations`
        });

        showAlert(`${confirmData.count} reservations approved successfully`);
      }

      localStorage.setItem('classroomReservations', JSON.stringify(reservationData));
      loadReservations();
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmData(null);

    } catch (error) {
      console.error('Error performing confirm action:', error);
      showAlert('Error performing action');
    }
  }, [confirmAction, confirmData, currentUser, loadReservations, showAlert, addRecentActivity]);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('authToken');
    navigate('/login');
  }, [navigate]);

  // Initial data load effect - runs once after component mounts
  useEffect(() => {
    if (loading) return;
    
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }

    initializeSharedStorage();
    loadReservations();
    loadRecentActivities();
  }, [currentUser, loading, navigate, initializeSharedStorage, loadReservations, loadRecentActivities]);

  // Update stats when reservations change
  useEffect(() => {
    const newStats = {
      pending: reservations.pending?.length || 0,
      approved: reservations.approved?.length || 0,
      denied: reservations.denied?.length || 0,
      total: (reservations.pending?.length || 0) + (reservations.approved?.length || 0) + (reservations.denied?.length || 0),
    };
    setStats(newStats);
  }, [reservations]);

  if (loading || !currentUser) return null;

  return (
    <div>
      <Header user={currentUser} onLogout={handleLogout} />
      <div className="dashboard-container">
        <ReservationManagement 
          filters={filters}
          onFilterChange={setFilters}
          stats={stats}
          reservations={filters.status === 'all' ? reservations.all : reservations[filters.status] || []}
          onCreate={() => setShowCreateModal(true)}
          onReview={(res) => { setSelectedReservation(res); setShowReviewModal(true); }}
          onConfirm={(action, data) => { setConfirmAction(action); setConfirmData(data); setShowConfirmModal(true); }}
        />
        <RecentActivity activities={recentActivities} />
      </div>
      
      {showReviewModal && (
        <ReviewModal 
          show={showReviewModal} 
          onClose={() => { setShowReviewModal(false); setSelectedReservation(null); }} 
          reservation={selectedReservation} 
          onSubmit={handleReviewSubmit} 
        />
      )}
      
      {showCreateModal && (
        <CreateReservationModal 
          show={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          onSubmit={handleCreateSubmit} 
        />
      )}
      
      {showConfirmModal && (
        <ConfirmModal 
          show={showConfirmModal} 
          onClose={() => { setShowConfirmModal(false); setConfirmAction(null); setConfirmData(null); }} 
          onConfirm={handleConfirmAction} 
          action={confirmAction}
          data={confirmData} 
        />
      )}
      
      {alertMessage && <Alert message={alertMessage} onClose={() => setAlertMessage('')} />}
    </div>
  );
}

export default AdminDashboard;