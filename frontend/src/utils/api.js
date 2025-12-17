const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'An error occurred');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name, email, password, role = 'student') {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  // Time Slots
  async getTimeSlots() {
    return this.request('/timeslots', {
      method: 'GET',
    });
  },

  async createTimeSlot(title, date, startTime, endTime, maxBookings = 1, staffId) {
    return this.request('/timeslots', {
      method: 'POST',
      body: JSON.stringify({ title, date, startTime, endTime, maxBookings, staffId }),
    });
  },

  async deleteTimeSlot(id) {
    return this.request(`/timeslots/${id}`, {
      method: 'DELETE',
    });
  },

  // Appointments
  async getAppointments() {
    return this.request('/appointments', {
      method: 'GET',
    });
  },

  async bookAppointment(timeSlotId) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify({ timeSlotId }),
    });
  },

  async cancelAppointment(appointmentId) {
    return this.request(`/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
    });
  },

  async deleteAppointment(appointmentId) {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'DELETE',
    });
  },

  // Users
  async getStaff() {
    return this.request('/users/staff', {
      method: 'GET',
    });
  },
};

