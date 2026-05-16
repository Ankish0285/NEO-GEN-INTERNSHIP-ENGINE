import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { toast } from 'react-hot-toast';

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || '',
  });
  const [loading, setLoading] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [newPartner, setNewPartner] = useState({
    email: '',
    organization: '',
    contactName: '',
    contactPhone: '',
    password: ''
  });

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Creating partner account...');
    try {
      await api.post('/users/partner', newPartner);
      toast.success('Partner created successfully', { id: toastId });
      setNewPartner({ email: '', organization: '', contactName: '', contactPhone: '', password: '' });
      setShowAddPartner(false);
    } catch (error) {
      console.error('Failed to create partner:', error);
      toast.error('Failed to create partner: ' + (error.response?.data?.message || error.message), { id: toastId });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Updating profile...');
    try {
      const response = await api.put('/profile/update', formData);
      updateUser(response);
      toast.success('Profile updated successfully', { id: toastId });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile: ' + (error.response?.data?.message || error.message), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('profilePicture', file);

    const toastId = toast.loading('Uploading profile picture...');
    try {
      setLoading(true);
      const response = await api.post('/profile/upload-picture', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newImageUrl = response.profilePicture;
      setFormData(prev => ({ ...prev, profilePicture: newImageUrl }));
      updateUser({ profilePicture: newImageUrl });
      
      toast.success('Profile picture uploaded successfully', { id: toastId });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image: ' + (error.response?.data?.message || error.message), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b-4 border-saffron pb-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Profile</h1>
        <Button onClick={() => setShowAddPartner(true)} className="bg-green-600 hover:bg-green-700 text-white">
          + Add Partner
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile details</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" isLoading={loading} className="w-full">
                Save Profile Setting
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-saffron shadow-lg">
                <img 
                    src={formData.profilePicture || "https://ui-avatars.com/api/?name=" + (formData.name || 'Admin') + "&background=random"} 
                    alt="Current Profile"
                    className="w-full h-full object-cover"
                />
            </div>
            <div>
                <h2 className="text-xl font-bold text-navy">{formData.name}</h2>
                <p className="text-sm text-gray-500 mt-1 capitalize font-medium">{user?.role} Account</p>
                <div className="mt-4 inline-flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span>System Active & Online</span>
                </div>
            </div>
        </Card>
      </div>

      <Modal
        isOpen={showAddPartner}
        onClose={() => setShowAddPartner(false)}
        title="Create Partner Account"
      >
        <form onSubmit={handleCreatePartner} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={newPartner.email}
              onChange={(e) => setNewPartner(prev => ({ ...prev, email: e.target.value }))}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization</label>
            <input
              type="text"
              value={newPartner.organization}
              onChange={(e) => setNewPartner(prev => ({ ...prev, organization: e.target.value }))}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Name</label>
            <input
              type="text"
              value={newPartner.contactName}
              onChange={(e) => setNewPartner(prev => ({ ...prev, contactName: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
            <input
              type="text"
              value={newPartner.contactPhone}
              onChange={(e) => setNewPartner(prev => ({ ...prev, contactPhone: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password (Optional)</label>
            <input
              type="password"
              value={newPartner.password}
              onChange={(e) => setNewPartner(prev => ({ ...prev, password: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Leave blank for auto-generated"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowAddPartner(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Partner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProfile;
