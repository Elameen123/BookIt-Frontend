import React, { useState, useEffect } from 'react';
import Header from './Header';
import AvailabilitySearch from './AvailabilitySearch';
import ClassroomsList from './ClassroomsList';
import ReservationsSection from './ReservationsSection';
import ReservationModal from './ReservationModal';
import AvatarModal from './AvatarModal';
import Alert from './Alert';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css'; // Converted from index.css

function UserDashboard() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]); // From getClassroomData()
  const [reservations, setReservations] = useState({
    reminders: [],
    pending: [],
    approved: [],
    denied: [],
  });
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Showing current availability');

  useEffect(() => {
    // Authentication check
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user) {
      navigate('/login');
      return;
    }
    setLoggedInUser(user);

    // Load data
    const classroomData = JSON.parse(localStorage.getItem('classroomData')) || {};
    setClassrooms(Object.keys(classroomData)); // Adjust based on structure

    loadReservations();
    checkRecurrentReminders();
    displayAllClassrooms();

    // Set interval for reminders
    const interval = setInterval(checkRecurrentReminders, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  const loadReservations = () => {
    // Fetch from backend API or localStorage
    const res = JSON.parse(localStorage.getItem('classroomReservations')) || {};
    setReservations(res);
  };

  const displayAllClassrooms = (isFiltered = false) => {
    // Fetch classrooms from API
    // For now, use placeholder
    setFilterStatus(isFiltered);
    setLocationStatus(isFiltered ? 'Filtered view' : 'Showing current availability');
  };

  const checkRecurrentReminders = () => {
    // Logic to check reminders
    // Use backend API if available
    // For now, placeholder
  };

  const showAlert = (message) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(''), 3000);
  };

  // Other functions converted to methods or hooks as needed

  if (!loggedInUser) return null;

  return (
    <div>
      <Header user={loggedInUser} onLogout={() => localStorage.removeItem('loggedInUser')} onChangeAvatar={() => setShowAvatarModal(true)} />
      <div className="dashboard-container">
        <AvailabilitySearch onSearch={searchAvailability} />
        <ClassroomsList classrooms={classrooms} filterStatus={filterStatus} locationStatus={locationStatus} />
        <ReservationsSection reservations={reservations} />
      </div>
      <ReservationModal show={showReservationModal} onClose={() => setShowReservationModal(false)} onSubmit={handleReservationSubmit} />
      <AvatarModal show={showAvatarModal} onClose={() => setShowAvatarModal(false)} onUpload={handleAvatarUpload} />
      {alertMessage && <Alert message={alertMessage} />}
    </div>
  );
}

export default UserDashboard;