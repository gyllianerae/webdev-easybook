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
  const [myAppointments, setMyAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [slotAppointments, setSlotAppointments] = useState({});
  const [slotLoading, setSlotLoading] = useState({});
  const [openSlotId, setOpenSlotId] = useState('');
  const [appointmentEdits, setAppointmentEdits] = useState({});
  const [savingAppointmentId, setSavingAppointmentId] = useState('');
  const [openAddListSlotId, setOpenAddListSlotId] = useState('');
  const [slotEditForms, setSlotEditForms] = useState({});

  const isAdmin = user && user.role === 'admin';
  const isStaff = user && user.role === 'staff';
  const isStaffOrAdmin = isStaff || isAdmin;
  const isStudent = user && user.role === 'student';
  const allowSearch = isStudent || isAdmin;
  const isSlotOwner = (slot) => slot?.createdBy?._id === user?.id;

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
      fetchStudents();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isStudent) {
      fetchMyAppointments();
    }
  }, [isStudent]);

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

  const fetchMyAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const appts = await api.getAppointments();
      const bookedOnly = (appts || []).filter((apt) => apt.status === 'booked');
      setMyAppointments(bookedOnly);
    } catch (err) {
      console.error(err);
      setMyAppointments([]);
    } finally {
      setAppointmentsLoading(false);
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

  const fetchStudents = async () => {
    try {
      const allUsers = await api.getUsers();
      const onlyStudents = (allUsers || []).filter((u) => u.role === 'student');
      setStudents(onlyStudents);
    } catch (err) {
      console.error(err);
      setStudents([]);
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
      if (isStudent) {
        await fetchMyAppointments();
      }
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
      alert(err.message || 'Failed to book appointment');
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setError('');
      await api.cancelAppointment(appointmentId);
      alert('Appointment cancelled successfully');
      await fetchTimeSlots();
      await fetchMyAppointments();
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment');
      alert(err.message || 'Failed to cancel appointment');
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

  const isAvailable = (slot) => {
    return slot.currentBookings < slot.maxBookings;
  };

  const canDeleteSlot = (slot) => {
    if (isAdmin) return true;
    if (!isStaff) return false;
    return slot?.createdBy?._id === user?.id;
  };

  const getMyAppointmentForSlot = (slotId) =>
    myAppointments.find((apt) => apt.timeSlot && apt.timeSlot._id === slotId);

  const matchesSearch = (slot) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = slot.title?.toLowerCase().includes(term);
    const staffMatch = slot.createdBy?.name?.toLowerCase().includes(term);
    return titleMatch || staffMatch;
  };

  const filteredTimeSlots = allowSearch ? timeSlots.filter(matchesSearch) : timeSlots;
  const filteredMyAppointments = isStudent
    ? myAppointments.filter((apt) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const titleMatch = apt.timeSlot?.title?.toLowerCase().includes(term);
        const staffMatch = apt.timeSlot?.createdBy?.name?.toLowerCase().includes(term);
        return titleMatch || staffMatch;
      })
    : myAppointments;

  let orderedTimeSlots = filteredTimeSlots;
  if (isStaff && !isAdmin) {
    orderedTimeSlots = [...filteredTimeSlots].sort((a, b) => {
      const aOwn = isSlotOwner(a);
      const bOwn = isSlotOwner(b);
      if (aOwn === bOwn) return 0;
      return aOwn ? -1 : 1; // own slots first
    });
  }

  const mySlots = isStaff && !isAdmin ? filteredTimeSlots.filter((slot) => isSlotOwner(slot)) : [];
  const otherSlots = isStaff && !isAdmin ? filteredTimeSlots.filter((slot) => !isSlotOwner(slot)) : [];

  const renderSlotCard = (slot) => (
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
          {isStudent && (
            (() => {
              const myApt = getMyAppointmentForSlot(slot._id);
              if (myApt && myApt.status === 'booked') {
                return (
                  <button
                    onClick={() => handleCancel(myApt._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    Cancel
                  </button>
                );
              }
              if (isAvailable(slot)) {
                return (
                  <button
                    onClick={() => handleBook(slot._id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                  >
                    Book Now
                  </button>
                );
              }
              return null;
            })()
          )}
          {isStaffOrAdmin && canDeleteSlot(slot) && (
            <button
              onClick={() => handleDelete(slot._id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
            >
              Delete
            </button>
          )}
          {(isAdmin || (isStaff && isSlotOwner(slot))) && (
            <button
              onClick={() => handleToggleManage(slot._id)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              {openSlotId === slot._id
                ? 'Hide'
                : isAdmin
                ? 'Manage Appointments'
                : 'See Students'}
            </button>
          )}
        </div>
      </div>

      {(isAdmin || (isStaff && isSlotOwner(slot))) && openSlotId === slot._id && (
        <div className="mt-4 border-t pt-4">
          {slotLoading[slot._id] ? (
            <p className="text-gray-500 text-sm">Loading appointments...</p>
          ) : (
            <>
              {(isAdmin || (isStaff && isSlotOwner(slot))) && (
                <div className="mb-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-800">Edit slot details</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={slotEditForms[slot._id]?.title || ''}
                      onChange={(e) => handleSlotEditChange(slot._id, 'title', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      placeholder="Title"
                    />
                    <input
                      type="time"
                      value={slotEditForms[slot._id]?.startTime || ''}
                      onChange={(e) => handleSlotEditChange(slot._id, 'startTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                    <input
                      type="time"
                      value={slotEditForms[slot._id]?.endTime || ''}
                      onChange={(e) => handleSlotEditChange(slot._id, 'endTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveSlotEdits(slot._id)}
                    disabled={savingAppointmentId === `slot-${slot._id}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingAppointmentId === `slot-${slot._id}` ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              )}

              {slotAppointments[slot._id] && slotAppointments[slot._id].length === 0 ? (
                <p className="text-gray-500 text-sm">No appointments booked for this slot.</p>
              ) : (
                <div className="space-y-3">
                  {(slotAppointments[slot._id] || []).map((apt) => (
                    <div
                      key={apt._id}
                      className="border border-gray-100 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {apt.student?.name || 'Unknown'} ({apt.student?.email || 'N/A'})
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </p>
                      </div>

                      {(isAdmin || (isStaff && isSlotOwner(slot))) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteAppointment(apt._id, slot._id)}
                            disabled={savingAppointmentId === apt._id}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  const fetchSlotAppointments = async (slotId) => {
    try {
      setSlotLoading((prev) => ({ ...prev, [slotId]: true }));
      const appts = await api.getAppointmentsByTimeSlot(slotId);
      const bookedOnly = (appts || []).filter((apt) => apt.status === 'booked');
      setSlotAppointments((prev) => ({ ...prev, [slotId]: bookedOnly }));
      const mapped = bookedOnly.reduce((acc, apt) => {
        acc[apt._id] = apt.student?._id || '';
        return acc;
      }, {});
      setAppointmentEdits((prev) => ({ ...prev, ...mapped }));
      const slot = timeSlots.find((s) => s._id === slotId);
      if (slot) {
        setSlotEditForms((prev) => ({
          ...prev,
          [slotId]: {
            title: slot.title,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSlotLoading((prev) => ({ ...prev, [slotId]: false }));
    }
  };

  const handleToggleManage = async (slotId) => {
    if (openSlotId === slotId) {
      setOpenSlotId('');
      return;
    }
    setOpenSlotId(slotId);
    await fetchSlotAppointments(slotId);
  };

  const handleEditStudent = async (appointmentId, slotId) => {
    const studentId = appointmentEdits[appointmentId];
    if (!studentId) return;
    try {
      setSavingAppointmentId(appointmentId);
      await api.adminUpdateAppointmentStudent(appointmentId, studentId);
      await fetchSlotAppointments(slotId);
      await fetchTimeSlots();
    } catch (err) {
      alert(err.message || 'Failed to update appointment');
    } finally {
      setSavingAppointmentId('');
    }
  };

  const handleAddStudent = async (slotId, studentId) => {
    if (!studentId) return;
    try {
      setSavingAppointmentId(`add-${slotId}`);
      await api.adminCreateAppointment(slotId, studentId);
      await fetchSlotAppointments(slotId);
      await fetchTimeSlots();
    } catch (err) {
      alert(err.message || 'Failed to add student');
    } finally {
      setSavingAppointmentId('');
    }
  };

  const handleSlotEditChange = (slotId, field, value) => {
    setSlotEditForms((prev) => ({
      ...prev,
      [slotId]: {
        ...(prev[slotId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveSlotEdits = async (slotId) => {
    const form = slotEditForms[slotId];
    if (!form) return;
    try {
      setSavingAppointmentId(`slot-${slotId}`);
      await api.updateTimeSlot(slotId, {
        title: form.title,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      await fetchTimeSlots();
      await fetchSlotAppointments(slotId);
    } catch (err) {
      alert(err.message || 'Failed to update time slot');
    } finally {
      setSavingAppointmentId('');
    }
  };

  const handleDeleteAppointment = async (appointmentId, slotId) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      setSavingAppointmentId(appointmentId);
      await api.deleteAppointment(appointmentId);
      await fetchSlotAppointments(slotId);
      await fetchTimeSlots();
    } catch (err) {
      alert(err.message || 'Failed to delete appointment');
    } finally {
      setSavingAppointmentId('');
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className={`grid gap-6 ${isStudent ? 'lg:grid-cols-3' : ''}`}>
        <div className={isStudent ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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

          {allowSearch && (
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by staff name or appointment title"
                className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
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
            <div className="bg-white rounded-lg shadow p-6">
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
              {orderedTimeSlots.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">
                    {searchTerm ? 'No time slots match this search.' : 'No time slots available.'}
                  </p>
                </div>
              ) : (
                orderedTimeSlots.map((slot) => (
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
                      {isStudent && (
                        (() => {
                          const myApt = getMyAppointmentForSlot(slot._id);
                          if (myApt && myApt.status === 'booked') {
                            return (
                              <button
                                onClick={() => handleCancel(myApt._id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                              >
                                Cancel
                              </button>
                            );
                          }
                          if (isAvailable(slot)) {
                            return (
                              <button
                                onClick={() => handleBook(slot._id)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                              >
                                Book Now
                              </button>
                            );
                          }
                          return null;
                        })()
                      )}
                      {isStaffOrAdmin && canDeleteSlot(slot) && (
                        <button
                          onClick={() => handleDelete(slot._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          Delete
                        </button>
                      )}
                      {(isAdmin || (isStaff && isSlotOwner(slot))) && (
                        <button
                          onClick={() => handleToggleManage(slot._id)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                        >
                          {openSlotId === slot._id ? 'Hide' : 'Manage'} Appointments
                        </button>
                      )}
                    </div>
                  </div>

                  {(isAdmin || (isStaff && isSlotOwner(slot))) && openSlotId === slot._id && (
                    <div className="mt-4 border-t pt-4">
                      {slotLoading[slot._id] ? (
                        <p className="text-gray-500 text-sm">Loading appointments...</p>
                      ) : (
                        <>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">Appointments in this slot</p>
                              <p className="text-xs text-gray-500">
                                {isAdmin
                                  ? 'Add or remove students for this time slot.'
                                  : 'Booked students for this time slot.'}
                              </p>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    setOpenAddListSlotId((prev) => (prev === slot._id ? '' : slot._id))
                                  }
                                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                                >
                                  {openAddListSlotId === slot._id ? 'Hide Students' : 'Add Student'}
                                </button>
                              </div>
                            )}
                          </div>

                          {isAdmin && openAddListSlotId === slot._id && (
                            <div className="mb-4 border border-gray-100 rounded-lg">
                              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                                {students.length === 0 ? (
                                  <p className="p-3 text-sm text-gray-500">No students available.</p>
                                ) : (
                                  students.map((stu) => (
                                    <div key={stu._id} className="p-3 flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{stu.name}</p>
                                        <p className="text-xs text-gray-500">{stu.email}</p>
                                      </div>
                                      <button
                                        onClick={() => handleAddStudent(slot._id, stu._id)}
                                        disabled={savingAppointmentId === `add-${slot._id}`}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {savingAppointmentId === `add-${slot._id}` ? 'Adding...' : 'Add'}
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {(isAdmin || (isStaff && isSlotOwner(slot))) && (
                            <div className="mb-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 space-y-3">
                              <p className="text-sm font-semibold text-gray-800">Edit slot details</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  value={slotEditForms[slot._id]?.title || ''}
                                  onChange={(e) => handleSlotEditChange(slot._id, 'title', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                  placeholder="Title"
                                />
                                <input
                                  type="time"
                                  value={slotEditForms[slot._id]?.startTime || ''}
                                  onChange={(e) => handleSlotEditChange(slot._id, 'startTime', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                                <input
                                  type="time"
                                  value={slotEditForms[slot._id]?.endTime || ''}
                                  onChange={(e) => handleSlotEditChange(slot._id, 'endTime', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                              </div>
                              <button
                                onClick={() => handleSaveSlotEdits(slot._id)}
                                disabled={savingAppointmentId === `slot-${slot._id}`}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingAppointmentId === `slot-${slot._id}` ? 'Saving...' : 'Save changes'}
                              </button>
                            </div>
                          )}

                          {slotAppointments[slot._id] && slotAppointments[slot._id].length === 0 ? (
                            <p className="text-gray-500 text-sm">No appointments booked for this slot.</p>
                          ) : (
                            <div className="space-y-3">
                              {(slotAppointments[slot._id] || []).map((apt) => (
                                <div
                                  key={apt._id}
                                  className="border border-gray-100 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {apt.student?.name || 'Unknown'} ({apt.student?.email || 'N/A'})
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Status: {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                    </p>
                                  </div>

                                  {isAdmin && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleDeleteAppointment(apt._id, slot._id)}
                                        disabled={savingAppointmentId === apt._id}
                                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                ))
              )}
            </div>
          )}
        </div>

        {isStudent && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-indigo-600">My Appointments</p>
                  <h3 className="text-xl font-semibold text-gray-900">Booked Slots</h3>
                </div>
              </div>

              {appointmentsLoading ? (
                <p className="text-gray-500 text-sm">Loading appointments...</p>
              ) : filteredMyAppointments.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'No booked appointments match this search.' : 'You have no booked appointments.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredMyAppointments.map((apt) => (
                    <div key={apt._id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {apt.timeSlot?.title || 'Unknown slot'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {apt.timeSlot?.date ? formatDate(apt.timeSlot.date) : 'Date unavailable'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {apt.timeSlot?.startTime && apt.timeSlot?.endTime
                              ? `${apt.timeSlot.startTime} - ${apt.timeSlot.endTime}`
                              : 'Time unavailable'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Booked on {formatDateTime(apt.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                            apt.status === 'booked'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeSlots;

