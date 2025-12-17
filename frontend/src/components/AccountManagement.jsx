import { useEffect, useState } from 'react';
import { api } from '../utils/api';

function AccountManagement() {
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const [users, setUsers] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, student, staff, admin

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setError('You do not have permission to view this page.');
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getUsers();
      setUsers(data);
      const mapped = data.reduce((acc, user) => {
        acc[user._id] = { name: user.name, email: user.email, role: user.role, password: '' };
        return acc;
      }, {});
      setEdits(mapped);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (id) => {
    const payload = { ...edits[id] };
    if (!payload.password) {
      delete payload.password;
    }
    setSavingId(id);
    setError('');
    try {
      const updated = await api.updateUser(id, payload);
      setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
      setEdits((prev) => ({
        ...prev,
        [id]: { ...prev[id], password: '' },
      }));
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSavingId('');
    }
  };

  const filtered = users
    .filter((u) => {
      if (roleFilter === 'all') return true;
      return u.role === roleFilter;
    })
    .filter((u) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
      );
    });

  return (
    <div className="px-4 py-6 sm:px-0 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
          <p className="text-sm text-gray-600">Manage user accounts, roles, and reset passwords.</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role"
          className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'student', 'staff', 'admin'].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-3 py-1 rounded-full text-sm border ${
              roleFilter === role
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!isAdmin ? (
        <div className="bg-white rounded-lg shadow p-6 text-red-700">Access denied.</div>
      ) : loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-gray-500">Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-gray-500">No users found.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((user) => {
            const edit = edits[user._id] || {};
            return (
              <div key={user._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={edit.name || ''}
                        onChange={(e) => handleChange(user._id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={edit.email || ''}
                        onChange={(e) => handleChange(user._id, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={edit.role || ''}
                        onChange={(e) => handleChange(user._id, 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={edit.password || ''}
                        onChange={(e) => handleChange(user._id, 'password', e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSave(user._id)}
                      disabled={savingId === user._id}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingId === user._id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AccountManagement;
