import React, { useState, useRef } from 'react';

import { Camera, Save, Loader2, X, User, Mail, Phone, BookOpen, GraduationCap, Award } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { validatePhone, validateName } from '../../../utils/validation';
import { resolveStoryImageUrl } from '../../../utils/resolveStoryImageUrl';
import { toast } from 'react-hot-toast';
import { Skeleton } from '../../ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

import { useStudentDashboard } from '../../../context/StudentDashboardContext';

const Profile = () => {
  const { profileData, setProfileData, loading: initialLoading } = useStudentDashboard();
  // We use initialLoading to match the variable name used in the component logic
  // or we can rename it in the destructuring

  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Local state for form to handle changes before save
  const [formData, setFormData] = useState({
    name: profileData?.name || '',
    phone: profileData?.phone || '',
    university: profileData?.university || '',
    course: profileData?.course || '',
    skills: profileData?.skills || [],
  });

  const [skillInput, setSkillInput] = useState('');

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="glass-card overflow-hidden">
           <Skeleton className="h-32 w-full" />
           <div className="px-8 pb-8">
             <div className="relative flex items-end -mt-12 mb-8">
               <Skeleton className="w-32 h-32 rounded-full border-4 border-white/80 glass-card p-1" />
               <div className="ml-6 mb-2 space-y-2">
                 <Skeleton className="h-8 w-48" />
                 <Skeleton className="h-4 w-32" />
               </div>
             </div>
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-24 w-full" />
             </div>
           </div>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const toastId = toast.loading('Uploading profile picture...');
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('profilePicture', file);
      const token = localStorage.getItem('token');
      const data = await api.upload('/profile/upload-picture', formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const url = data.profilePicture;
      if (!url) {
        throw new Error('No image URL returned from server');
      }
      setProfileData((prev) => ({
        ...prev,
        profilePicture: url,
        profileCompletionPercentage: data.profileCompletionPercentage ?? prev.profileCompletionPercentage,
      }));
      updateUser({
        profilePicture: url,
        profileCompletionPercentage: data.profileCompletionPercentage,
      });
      toast.success('Profile picture saved!', { id: toastId });
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to upload image';
      toast.error(msg, { id: toastId });
      console.error(error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!validateName(formData.name)) {
        toast.error('Please enter a valid full name');
        return;
    }
    if (formData.phone && !validatePhone(formData.phone)) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
    }

    setLoading(true);
    const toastId = toast.loading('Saving changes...');
    
    try {
      const updated = await api.put('/profile/update', {
        name: formData.name,
        phone: formData.phone,
        university: formData.university,
        course: formData.course,
        skills: formData.skills,
      });
      setProfileData((prev) => ({ ...prev, ...updated }));
      updateUser(updated);
      toast.success('Profile updated successfully!', { id: toastId });
    } catch (error) {
      const msg = error.data?.message || error.message || 'Failed to update profile';
      toast.error(msg, { id: toastId });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, skillInput.trim()]
        }));
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and professional details.</p>
      </div>

      <motion.div 
        variants={itemVariants}
        className="glass-card shadow-lg p-0 overflow-hidden"
      >
        {/* Profile Header / Cover */}
        <div className="h-32 bg-gradient-to-r from-saffron/80 via-white/40 to-green-primary/80 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 pattern-grid-lg opacity-40"></div>
        </div>

        <div className="px-8 pb-8">
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end -mt-12 mb-8 gap-6">
            <div className="relative group">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-32 h-32 rounded-full border-4 border-white/80 glass-card p-1 shadow-2xl overflow-hidden relative"
              >
                <img 
                  src={
                    resolveStoryImageUrl(profileData?.profilePicture) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=random`
                  } 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(ev) => {
                    ev.currentTarget.onerror = null;
                    ev.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=random`;
                  }}
                />
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="animate-spin text-white w-8 h-8" />
                    </div>
                )}
              </motion.div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 p-2.5 bg-saffron rounded-full shadow-lg border-2 border-white text-white hover:bg-saffron-hover transition-colors"
              >
                <Camera size={18} />
              </motion.button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <div className="text-center sm:text-left mb-2 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{formData.name || 'Your Name'}</h2>
              <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                <GraduationCap size={16} />
                {formData.university || 'University Student'}
              </p>
            </div>
             <div className="hidden sm:block">
                <div className="bg-green-light px-4 py-2 rounded-xl text-center border border-green-primary/20">
                    <span className="block text-xs font-bold text-green-primary uppercase tracking-wider">Completion</span>
                    <span className="block text-xl font-extrabold text-green-hover">{profileData?.profileCompletionPercentage || 0}%</span>
                </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail size={16} className="text-blue-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone size={16} className="text-blue-500" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="+1 234 567 890"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <GraduationCap size={16} className="text-blue-500" />
                  University
                </label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="University Name"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-500" />
                  Course / Major
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="B.Tech Computer Science"
                />
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Award size={16} className="text-blue-500" />
                Skills
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all min-h-[100px] content-start">
                <AnimatePresence>
                  {formData.skills.map((skill, index) => (
                    <motion.span 
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-gradient-to-r from-saffron-light to-white text-navy px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-saffron/20 flex items-center gap-2"
                    >
                      {skill}
                      <button 
                        type="button" 
                        onClick={() => removeSkill(skill)} 
                        className="text-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  className="flex-1 outline-none min-w-[150px] bg-transparent p-1.5 text-sm"
                  placeholder="Type a skill & press Enter"
                />
              </div>
              <p className="text-xs text-gray-400">Press Enter to add a skill</p>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="flex justify-end pt-6 border-t border-gray-100"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {loading ? (
                    <>
                        <Loader2 size={20} className="mr-2 animate-spin" />
                        Saving Changes...
                    </>
                ) : (
                    <>
                        <Save size={20} className="mr-2" />
                        Save Changes
                    </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;