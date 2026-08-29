import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';

const statusBadge = (status) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };
  const icons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
  };
  const Icon = icons[status] || Clock;
  const label = status || 'pending';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[label] || styles.pending}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

const Users = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const pendingCount = partners.filter((p) => p.partnerStatus === 'pending').length;

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPartners = async () => {
    try {
      const data = await api.get('/users/partners');
      setPartners(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchPartners()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBlockStudent = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this student?`)) return;

    try {
      await api.put(`/admin/users/${userId}/block`);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isBlocked: !currentStatus } : u)));
      toast.success(`Student ${currentStatus ? 'unblocked' : 'blocked'} successfully`);
    } catch (error) {
      toast.error('Failed to change block status');
    }
  };

  const handleImpersonateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to login as this user?')) return;
    try {
      const response = await api.post(`/admin/impersonate/${userId}`);
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        window.location.href =
          (response.user.role === 'admin' || response.user.role === 'super_admin')
            ? '/admin/dashboard'
            : response.user.role === 'partner'
              ? '/partner/dashboard'
              : '/dashboard';
      }
    } catch {
      toast.error('Impersonation failed');
    }
  };

  const handleDeleteStudent = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this student? This cannot be undone.')) return;

    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('Student deleted');
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Make this user a ${newRole}? They will need Super Admin approval before they can log in as a partner.`)) return;

    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated. Approve them in the Partners tab when ready.');
      if (newRole === 'partner') setActiveTab('partners');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to change user role');
    }
  };

  const handlePartnerStatus = async (userId, status) => {
    const labels = { approved: 'approve', rejected: 'reject', pending: 'mark as pending' };
    if (!window.confirm(`Are you sure you want to ${labels[status]} this partner?`)) return;

    try {
      await api.put(`/admin/partners/${userId}/status`, { status });
      toast.success(`Partner ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'set to pending'}`);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update partner status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Super Admin can approve partner accounts before they can access the partner portal.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Students
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-md text-sm font-medium relative ${
              activeTab === 'partners'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Partners
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'partners' && pendingCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>{pendingCount}</strong> partner{pendingCount > 1 ? 's' : ''} waiting for approval. Use <strong>Approve</strong> to allow login and posting internships.
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                {activeTab === 'students' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                )}
                {activeTab === 'partners' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : (activeTab === 'students' ? users : partners).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
                </tr>
              ) : (
                (activeTab === 'students' ? users : partners).map((user) => (
                  <tr key={user._id} className={user.partnerStatus === 'pending' ? 'bg-amber-50/50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    {activeTab === 'students' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.university || '—'}</td>
                    )}
                    {activeTab === 'partners' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.partnerInfo?.organization || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{statusBadge(user.partnerStatus)}</td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {activeTab === 'students' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleBlockStudent(user._id, user.isBlocked)}
                            className={user.isBlocked ? 'text-gray-500' : 'text-orange-600 hover:text-orange-900'}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeRole(user._id, 'partner')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Make Partner
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImpersonateUser(user._id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Impersonate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(user._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      {activeTab === 'partners' && (
                        <div className="flex flex-wrap gap-2">
                          {user.partnerStatus !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handlePartnerStatus(user._id, 'approved')}
                              className="inline-flex items-center gap-1 text-green-700 hover:text-green-900 font-semibold"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                          )}
                          {user.partnerStatus !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handlePartnerStatus(user._id, 'rejected')}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-900"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          )}
                          {user.partnerStatus === 'approved' && (
                            <button
                              type="button"
                              onClick={() => handlePartnerStatus(user._id, 'pending')}
                              className="text-amber-700 hover:text-amber-900"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleImpersonateUser(user._id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Impersonate
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Users;
