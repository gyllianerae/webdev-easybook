import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Appointments() {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, booked, cancelled

  const isStudent = user && user.role === 'student';
  const isStaff = user && (user.role === 'staff' || user.role === 'admin');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setError('');
      await api.cancelAppointment(appointmentId);
      alert('Appointment cancelled successfully');
      await fetchAppointments();
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment');
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      setError('');
      await api.deleteAppointment(appointmentId);
      await fetchAppointments();
    } catch (err) {
      setError(err.message || 'Failed to delete appointment');
      alert(err.message || 'Failed to delete appointment');
    }
  };

  // Filter appointments based on user role and status filter
  const filteredAppointments = appointments.filter((apt) => {
    // Apply status filter
    if (filter !== 'all' && apt.status !== filter) {
      return false;
    }
    return true;
  });

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isStudent ? 'My Appointments' : 'All Appointments'}
        </h2>
        {isStaff && (
          <div className="text-sm text-gray-600">
            Total: {appointments.length} appointments
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      {isStaff && (
        <div className="mb-6 flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 border-b-2 font-medium transition ${
              filter === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('booked')}
            className={`px-4 py-2 border-b-2 font-medium transition ${
              filter === 'booked'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Booked
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 border-b-2 font-medium transition ${
              filter === 'cancelled'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Cancelled
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading appointments...</p>
        </div>
      )}

      {/* Appointments List */}
      {!loading && (
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-gray-500">
              {isStudent
                ? "You don't have any appointments yet."
                : 'No appointments found.'}
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">
                      {appointment.timeSlot.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'booked'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center">
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(appointment.timeSlot.date)}
                    </p>
                    <p className="flex items-center">
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                    </p>
                    {isStaff && (
                      <p className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Student: {appointment.student.name} ({appointment.student.email})
                      </p>
                    )}
                    <p className="flex items-center">
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Host: {appointment.timeSlot.createdBy.name}
                    </p>
                    <p className="flex items-center text-xs text-gray-500">
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Booked on: {formatDateTime(appointment.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end space-y-2">
                  {isStudent && appointment.status === 'booked' && (
                    <button
                      onClick={() => handleCancel(appointment._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  {isStaff && (
                    <button
                      onClick={() => handleDelete(appointment._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      )}
    </div>
  );
}

export default Appointments;

