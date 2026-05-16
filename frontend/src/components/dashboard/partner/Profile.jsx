import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';

const PartnerProfile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || '',
  });
  const [loading, setLoading] = useState(false);

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
    try {
      const response = await api.put('/profile/update', formData);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('profilePicture', file);

    try {
      setLoading(true);
      const response = await api.post('/profile/upload-picture', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrl = response.profilePicture;
      setFormData(prev => ({ ...prev, profilePicture: newUrl }));
      updateUser({ profilePicture: newUrl });
      alert('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 border-b-4 border-saffron pb-2 inline-block">Partner Profile</h1>
      
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
                    src={formData.profilePicture || "https://ui-avatars.com/api/?name=" + (formData.name || 'Partner') + "&background=random"} 
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
    </div>
  );
};

export default PartnerProfile;
