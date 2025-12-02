import { useState } from 'react';

function Appointments() {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const isStudent = user && user.role === 'student';
  const isStaff = user && (user.role === 'staff' || user.role === 'admin');

  // Static sample data
  const [appointments] = useState([
    {
      _id: '1',
      student: { name: 'John Doe', email: 'john@example.com' },
      timeSlot: {
        title: 'Office Hours - Math Tutoring',
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '11:00',
        createdBy: { name: 'Dr. Smith' },
      },
      status: 'booked',
      createdAt: '2024-01-10T08:00:00Z',
    },
    {
      _id: '2',
      student: { name: 'Jane Smith', email: 'jane@example.com' },
      timeSlot: {
        title: 'Career Counseling Session',
        date: '2024-01-17',
        startTime: '09:00',
        endTime: '10:00',
        createdBy: { name: 'Ms. Williams' },
      },
      status: 'booked',
      createdAt: '2024-01-11T10:30:00Z',
    },
    {
      _id: '3',
      student: { name: 'Bob Johnson', email: 'bob@example.com' },
      timeSlot: {
        title: 'Office Hours - Science Help',
        date: '2024-01-16',
        startTime: '14:00',
        endTime: '15:30',
        createdBy: { name: 'Dr. Johnson' },
      },
      status: 'cancelled',
      createdAt: '2024-01-12T14:20:00Z',
    },
  ]);

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

  const handleCancel = (appointmentId) => {
    // Static cancellation - will be implemented with API
    alert(`Cancellation for appointment ${appointmentId} will be implemented with API integration`);
  };

  const handleDelete = (appointmentId) => {
    // Static deletion - will be implemented with API
    alert(`Deletion for appointment ${appointmentId} will be implemented with API integration`);
  };

  // Filter appointments based on user role
  const filteredAppointments = isStudent
    ? appointments.filter((apt) => apt.student.email === user?.email)
    : appointments;

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

      {/* Filter Tabs */}
      {isStaff && (
        <div className="mb-6 flex space-x-4 border-b border-gray-200">
          <button className="px-4 py-2 border-b-2 border-indigo-500 text-indigo-600 font-medium">
            All
          </button>
          <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
            Booked
          </button>
          <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
            Cancelled
          </button>
        </div>
      )}

      {/* Appointments List */}
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
    </div>
  );
}

export default Appointments;

