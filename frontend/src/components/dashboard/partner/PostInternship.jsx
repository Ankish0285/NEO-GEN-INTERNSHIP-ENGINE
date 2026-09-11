import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { api } from '../../../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PostInternship = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get('edit');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingInternship, setLoadingInternship] = useState(Boolean(editingId));
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    department: '',
    location: '',
    type: 'Remote',
    workMode: '',
    skills: '',
    description: '',
    eligibility: '',
    requirements: '',
    responsibilities: '',
    duration: '',
    stipend: '',
    deadline: '',
    startDate: '',
    openings: '',
    benefits: '',
    applyLink: ''
  });

  const toDateInput = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (!editingId) return;
    const load = async () => {
      try {
        setLoadingInternship(true);
        const data = await api.get(`/internships/${editingId}`);
        const internship = data?.data || data;
        setFormData({
          title: internship.title || '',
          organization: internship.organization || '',
          department: internship.department || '',
          location: internship.location || '',
          type: internship.type || 'Remote',
          workMode: internship.workMode || '',
          skills: Array.isArray(internship.skills) ? internship.skills.join(', ') : (internship.skills || ''),
          description: internship.description || '',
          eligibility: internship.eligibility || '',
          requirements: internship.requirements || '',
          responsibilities: internship.responsibilities || '',
          duration: internship.duration || '',
          stipend: internship.stipend || '',
          deadline: toDateInput(internship.deadline),
          startDate: toDateInput(internship.startDate),
          openings: internship.openings || '',
          benefits: internship.benefits || '',
          applyLink: internship.applyLink || ''
        });
      } catch (err) {
        console.error('Error loading internship for edit:', err);
        alert('Failed to load internship: ' + (err.response?.data?.message || err.message));
        navigate('/partner/dashboard');
      } finally {
        setLoadingInternship(false);
      }
    };
    load();
  }, [editingId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const internshipData = {
        ...formData,
        skills: typeof formData.skills === 'string'
          ? formData.skills.split(',').map(f => f.trim()).filter(Boolean)
          : (formData.skills || [])
      };
      if (editingId) {
        const response = await api.put(`/internships/${editingId}`, internshipData);
        alert(`Internship updated successfully!${response?.data?.message ? ' — ' + response.data.message : ''}`);
      } else {
        await api.post('/internships', internshipData);
        alert('Internship posted successfully!');
      }
      navigate('/partner/dashboard');
    } catch (error) {
      console.error(error);
      alert(`Failed to ${editingId ? 'update' : 'post'} internship: ` + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInternship) {
    return (
      <div className="space-y-6">
        <Card className="p-6 text-center text-gray-500">Loading internship details...</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Internship' : 'Post New Internship'}</h1>
        {editingId && (
          <Button variant="outline" onClick={() => navigate('/partner/dashboard')}>
            Cancel
          </Button>
        )}
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Internship Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Work Mode</label>
              <select
                name="workMode"
                value={formData.workMode || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select work mode</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
                <option value="In-office">In-office</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Internship Type</label>
              <select
                name="type"
                value={formData.type || 'Remote'}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="In-office">In-office</option>
                <option value="Part-time">Part-time</option>
                <option value="Full-time">Full-time</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="React, Node.js, Design"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Eligibility Criteria</label>
              <textarea
                name="eligibility"
                value={formData.eligibility}
                onChange={handleInputChange}
                required
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Requirements</label>
              <textarea
                name="requirements"
                value={formData.requirements || ''}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Responsibilities</label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities || ''}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Benefits</label>
              <textarea
                name="benefits"
                value={formData.benefits || ''}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Number of Openings</label>
              <input
                type="number"
                min="1"
                name="openings"
                value={formData.openings || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g. 6 months"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Stipend</label>
              <input
                type="text"
                name="stipend"
                value={formData.stipend}
                onChange={handleInputChange}
                placeholder="e.g. ₹10,000/month"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Application Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Application Link (Optional)</label>
              <input
                type="url"
                name="applyLink"
                value={formData.applyLink}
                onChange={handleInputChange}
                placeholder="https://example.com/apply"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>
              {editingId ? 'Update Internship' : 'Post Internship'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PostInternship;
