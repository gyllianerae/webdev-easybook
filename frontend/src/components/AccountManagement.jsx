import { useEffect, useState } from 'react';
import { api } from '../utils/api';

function AccountManagement() {
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '' });
  const [savingId, setSavingId] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'student', password: '' });
  const [creating, setCreating] = useState(false);

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
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (id) => {
    const payload = { ...editForm };
    if (!payload.password) {
      delete payload.password;
    }
    setSavingId(id);
    setError('');
    try {
      const updated = await api.updateUser(id, payload);
      setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
      setEditingUser(null);
      setEditForm({ name: '', email: '', role: '', password: '' });
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSavingId('');
    }
  };

  const handleDelete = async (id) => {
    const userToDelete = users.find((u) => u._id === id);
    if (!userToDelete) return;

    if (!window.confirm(`Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      setError('');
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      alert('User deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleAddChange = (field, value) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password || !addForm.role) {
      setError('Please fill in all fields');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const newUser = await api.createUser(addForm.name, addForm.email, addForm.password, addForm.role);
      setUsers((prev) => [...prev, newUser]);
      setAddForm({ name: '', email: '', role: 'student', password: '' });
      setShowAddForm(false);
      alert('User created successfully');
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filtered.map((u) => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filtered.slice(startIndex, endIndex);

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="px-4 py-6 sm:px-0 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
          <p className="text-sm text-gray-600">Manage user accounts, roles, and reset passwords.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role"
            className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium whitespace-nowrap"
            >
              + Add User
            </button>
          )}
        </div>
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
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-600">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Full Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      <SortIcon field="email" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Role
                      <SortIcon field="role" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Joined Date
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user, index) => (
                  <tr
                    key={user._id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                            {getInitials(user.name)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-2">Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-2 mr-2 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700">of {filtered.length} rows</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ««
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              {totalPages > 5 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  {totalPages}
                </button>
              )}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50">
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md"></div>
          <div className="relative flex items-center justify-center min-h-screen py-8">
            <div className="relative mx-auto p-6 w-full max-w-lg shadow-xl rounded-lg bg-white border border-gray-200 z-10">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit User</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => handleEditChange('role', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => handleEditChange('password', e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setEditForm({ name: '', email: '', role: '', password: '' });
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(editingUser)}
                  disabled={savingId === editingUser}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {savingId === editingUser ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50">
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md"></div>
          <div className="relative flex items-center justify-center min-h-screen py-8">
            <div className="relative mx-auto p-6 w-full max-w-lg shadow-xl rounded-lg bg-white border border-gray-200 z-10">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New User</h3>
                <form onSubmit={handleCreateUser} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) => handleAddChange('name', e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => handleAddChange('email', e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                    <select
                      value={addForm.role}
                      onChange={(e) => handleAddChange('role', e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition"
                    >
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      value={addForm.password}
                      onChange={(e) => handleAddChange('password', e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setAddForm({ name: '', email: '', role: 'student', password: '' });
                        setError('');
                      }}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {creating ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountManagement;
