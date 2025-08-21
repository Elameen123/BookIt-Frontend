import React, { useState, useEffect } from 'react';
    import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
    import Header from '../components/Header';
    import AvailabilitySearch from '../components/AvailabilitySearch';
    import ClassroomsList from '../components/ClassroomsList';
    import ReservationsSection from '../components/ReservationsSection';
    import ReservationModal from '../components/ReservationModal';
    import AvatarModal from '../components/AvatarModal';
    import Alert from '../components/Alert';
    import { useNavigate } from 'react-router-dom';
    import './UserDashboard.css'; // Same folder

    function UserDashboard() {
      const { currentUser, loading } = useAuth();
      const navigate = useNavigate();
      const [classrooms, setClassrooms] = useState([]);
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
        if (loading) return;
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const classroomData = JSON.parse(localStorage.getItem('classroomData')) || {};
        setClassrooms(Object.keys(classroomData));

        loadReservations();
        checkRecurrentReminders();
        displayAllClassrooms();

        const interval = setInterval(checkRecurrentReminders, 60000);
        return () => clearInterval(interval);
      }, [currentUser, loading, navigate]);

      const loadReservations = () => {
        const res = JSON.parse(localStorage.getItem('classroomReservations')) || {};
        setReservations(res);
      };

      const displayAllClassrooms = (isFiltered = false) => {
        setFilterStatus(isFiltered);
        setLocationStatus(isFiltered ? 'Filtered view' : 'Showing current availability');
      };

      const checkRecurrentReminders = () => {};

      const showAlert = (message) => {
        setAlertMessage(message);
        setTimeout(() => setAlertMessage(''), 3000);
      };

      if (loading || !currentUser) return null;

      return (
        <div>
          <Header user={currentUser} onLogout={() => navigate('/login')} onChangeAvatar={() => setShowAvatarModal(true)} />
          <div className="dashboard-container">
            <AvailabilitySearch onSearch={displayAllClassrooms} />
            <ClassroomsList classrooms={classrooms} filterStatus={filterStatus} locationStatus={locationStatus} />
            <ReservationsSection reservations={reservations} />
          </div>
          <ReservationModal show={showReservationModal} onClose={() => setShowReservationModal(false)} onSubmit={() => {}} />
          <AvatarModal show={showAvatarModal} onClose={() => setShowAvatarModal(false)} onUpload={() => {}} />
          {alertMessage && <Alert message={alertMessage} />}
        </div>
      );
    }

    export default UserDashboard;
