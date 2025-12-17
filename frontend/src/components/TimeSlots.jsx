import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function TimeSlots() {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    maxBookings: 1,
    staffId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user && user.role === 'admin';
  const isStaff = user && user.role === 'staff';
  const isStaffOrAdmin = isStaff || isAdmin;
  const isStudent = user && user.role === 'student';

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
    }
  }, [isAdmin]);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const slots = await api.getTimeSlots();
      setTimeSlots(slots);
    } catch (err) {
      setError(err.message || 'Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const staff = await api.getStaff();
      setStaffOptions(staff);
    } catch (err) {
      // Keep the UI usable even if this fails; surface message when admin submits without staff
      console.error(err);
      setStaffOptions([]);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isAdmin && !formData.staffId) {
        setSubmitting(false);
        setError('Please select a staff member for this time slot.');
        return;
      }

      await api.createTimeSlot(
        formData.title,
        formData.date,
        formData.startTime,
        formData.endTime,
        parseInt(formData.maxBookings),
        isAdmin ? formData.staffId : undefined
      );
      setShowCreateForm(false);
      setFormData({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        maxBookings: 1,
        staffId: '',
      });
      await fetchTimeSlots();
    } catch (err) {
      setError(err.message || 'Failed to create time slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) {
      return;
    }

    try {
      setError('');
      await api.deleteTimeSlot(slotId);
      await fetchTimeSlots();
    } catch (err) {
      setError(err.message || 'Failed to delete time slot');
    }
  };

  const handleBook = async (slotId) => {
    try {
      setError('');
      await api.bookAppointment(slotId);
      alert('Appointment booked successfully!');
      await fetchTimeSlots();
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
      alert(err.message || 'Failed to book appointment');
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

  const isAvailable = (slot) => {
    return slot.currentBookings < slot.maxBookings;
  };

  const canDeleteSlot = (slot) => {
    if (isAdmin) return true;
    if (!isStaff) return false;
    return slot?.createdBy?._id === user?.id;
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Time Slots</h2>
        {isStaffOrAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {showCreateForm ? 'Cancel' : '+ Create Time Slot'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading time slots...</p>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && isStaffOrAdmin && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Time Slot</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isAdmin && (
              <div>
                <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Staff
                </label>
                <select
                  id="staffId"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="">Select staff member</option>
                  {staffOptions.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Office Hours - Math Tutoring"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="maxBookings" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Bookings
                </label>
                <input
                  type="number"
                  id="maxBookings"
                  name="maxBookings"
                  value={formData.maxBookings}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Time Slot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Time Slots List */}
      {!loading && (
        <div className="space-y-4">
          {timeSlots.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No time slots available.</p>
            </div>
          ) : (
            timeSlots.map((slot) => (
            <div
              key={slot._id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{slot.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
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
                      {formatDate(slot.date)}
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
                      {slot.startTime} - {slot.endTime}
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Created by: {slot.createdBy.name}
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Bookings: {slot.currentBookings} / {slot.maxBookings}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end space-y-2">
                  {isAvailable(slot) ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Available
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Full
                    </span>
                  )}
                  {isStudent && isAvailable(slot) && (
                    <button
                      onClick={() => handleBook(slot._id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                    >
                      Book Now
                    </button>
                  )}
                  {isStaffOrAdmin && canDeleteSlot(slot) && (
                    <button
                      onClick={() => handleDelete(slot._id)}
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

export default TimeSlots;

