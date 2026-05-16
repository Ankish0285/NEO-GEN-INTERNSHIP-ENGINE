import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Shield, Trash2, AlertTriangle, Check, X, Mail } from 'lucide-react';
import Card from '../../ui/Card';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    
    try {
      setIsDeleting(true);
      await api.delete('/users/delete-account');
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 pb-10">
      <div className="flex items-center justify-between mb-2">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500">Manage your account preferences and security</p>
        </div>
      </div>

      {/* Account Info */}
      <Card title="Account Information" subtitle="Your personal account details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
              <User size={18} className="mr-2 text-gray-400" />
              {user?.name || 'User'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
              <Mail size={18} className="mr-2 text-gray-400" />
              {user?.email || 'email@example.com'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 capitalize">
              <Shield size={18} className="mr-2 text-gray-400" />
              {user?.role || 'Student'}
            </div>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card title="Security" subtitle="Password and authentication">
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
                <div className="bg-blue-50 p-2 rounded-full mr-4">
                    <Lock size={20} className="text-blue-600" />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-900">Password</h4>
                    <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                Change Password
            </button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-100 ring-1 ring-red-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    Danger Zone
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Permanently delete your account and all of your content. This action cannot be undone.
                </p>
            </div>
            <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
                <Trash2 size={18} />
                Delete Account
            </button>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <div className="bg-red-100 p-2 rounded-full">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Delete Account</h3>
                    </div>
                    
                    <p className="text-gray-600 mb-4">
                        Are you sure you want to delete your account? This action is <span className="font-bold text-gray-900">permanent</span> and cannot be undone. All your applications, resume data, and profile information will be erased.
                    </p>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                        </label>
                        <input 
                            type="text" 
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                            placeholder="Type DELETE"
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete My Account'}
                        </button>
                    </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
