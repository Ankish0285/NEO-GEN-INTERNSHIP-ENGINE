import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { api } from '../../../services/api';

const Users = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // My new backend uses toggle approach, or direct PUT
      const response = await api.put(`/admin/users/${userId}/block`);
      setUsers(prev => prev.map(u => (u._id === userId ? { ...u, isBlocked: !currentStatus } : u)));
      toast.success(`Student ${currentStatus ? 'unblocked' : 'blocked'} successfully`);
    } catch (error) {
      toast.error('Failed to change block status');
    }
  };

  const handleImpersonateUser = async (userId) => {
    if(!window.confirm('Are you sure you want to login as this user?')) return;
    try {
      const response = await api.post(`/admin/impersonate/${userId}`);
      if(response.token) {
         localStorage.setItem('token', response.token);
         localStorage.setItem('user', JSON.stringify(response.user));
         window.location.href = response.user.role === 'admin' ? '/admin/dashboard' : response.user.role === 'partner' ? '/partner/dashboard' : '/dashboard';
      }
    } catch(err) {
       toast.error('Impersonation failed');
    }
  };

  const handleDeleteStudent = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this student and their applications? This action cannot be undone.')) return;

    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      alert('Student deleted successfully');
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('Failed to delete student');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to upgrade this user to a ${newRole}?`)) return;

    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User upgraded to ${newRole} successfully`);
      loadData(); // refresh to move user from Students tab to Partners tab
    } catch (error) {
      toast.error('Failed to change user role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <div className="flex space-x-2">
          <button
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
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'partners'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Partners
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                {activeTab === 'students' && (
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                )}
                 {activeTab === 'partners' && (
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : (activeTab === 'students' ? users : partners).length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
                </tr>
              ) : (
                (activeTab === 'students' ? users : partners).map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {user.role}
                    </td>
                    {activeTab === 'students' && (
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {user.university || '-'}
                       </td>
                    )}
                     {activeTab === 'partners' && (
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {user.organization || '-'}
                       </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {activeTab === 'students' && (
                        <>
                          <button 
                            onClick={() => handleBlockStudent(user._id, user.isBlocked)}
                            className={`${user.isBlocked ? 'text-gray-500' : 'text-orange-600 hover:text-orange-900'}`}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button 
                            onClick={() => handleChangeRole(user._id, 'partner')}
                            className="text-green-600 hover:text-green-900 ml-2"
                          >
                            Make Partner
                          </button>
                          <button 
                            onClick={() => handleImpersonateUser(user._id)}
                            className="text-indigo-600 hover:text-indigo-900 ml-2"
                          >
                            Impersonate
                          </button>
                          <button 
                            onClick={() => handleDeleteStudent(user._id)}
                            className="text-red-600 hover:text-red-900 ml-2"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {activeTab === 'partners' && (
                        <span className="text-gray-400">No actions</span>
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
