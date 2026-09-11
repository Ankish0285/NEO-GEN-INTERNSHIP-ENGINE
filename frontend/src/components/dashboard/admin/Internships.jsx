import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { api } from '../../../services/api';

const Internships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const DEFAULT_FORM = {
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
    applyLink: '',
    status: 'pending'
  };

  // Form State
  const [newInternship, setNewInternship] = useState({ ...DEFAULT_FORM });

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const data = await api.get('/internships/admin/all');
      setInternships(data);
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInternship(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toDateInput = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleEditInternship = (internship) => {
    setEditingId(internship._id);
    setNewInternship({
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
      applyLink: internship.applyLink || '',
      status: internship.status || 'pending'
    });
    setIsPosting(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewInternship({ ...DEFAULT_FORM });
    setIsPosting(false);
  };

  const handlePostInternship = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const internshipData = {
        ...newInternship,
        skills: typeof newInternship.skills === 'string'
          ? newInternship.skills.split(',').map(f => f.trim()).filter(Boolean)
          : (newInternship.skills || [])
      };
      if (editingId) {
        // UPDATE existing internship
        const response = await api.put(`/internships/${editingId}`, internshipData);
        alert(`Internship updated successfully!${response?.data?.message ? ' — ' + response.data.message : ''}`);
      } else {
        // CREATE new internship
        await api.post('/internships', internshipData);
        alert('Internship posted successfully!');
      }
      handleCancelEdit();
      fetchInternships();
    } catch (error) {
      console.error(error);
      alert(`Failed to ${editingId ? 'update' : 'post'} internship: ` + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInternship = async (id) => {
    if (!window.confirm('Are you sure you want to delete this internship? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/internships/${id}`);
      setInternships(prev => prev.filter(i => i._id !== id));
      alert('Internship deleted successfully');
    } catch (error) {
      console.error('Failed to delete internship:', error);
      alert('Failed to delete internship');
    }
  };

  const handleApproveInternship = async (id) => {
    try {
      await api.put(`/internships/${id}/approve`);
      alert('Internship approved and is now live!');
      fetchInternships();
    } catch (error) {
      console.error('Failed to approve internship:', error);
      alert('Failed to approve internship');
    }
  };

  if (isPosting) {
    const isEdit = Boolean(editingId);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Internship' : 'Post New Internship'}</h1>
          <Button variant="outline" onClick={handleCancelEdit}>
            Cancel
          </Button>
        </div>

        <Card className="p-6">
          <form onSubmit={handlePostInternship} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Internship Title</label>
                <input
                  type="text"
                  name="title"
                  value={newInternship.title}
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
                  value={newInternship.organization}
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
                  value={newInternship.department}
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
                  value={newInternship.location}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Work Mode</label>
                <select
                  name="workMode"
                  value={newInternship.workMode || ''}
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
                  value={newInternship.type || 'Remote'}
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
                  value={newInternship.skills}
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
                  value={newInternship.description}
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
                  value={newInternship.eligibility}
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
                  value={newInternship.requirements || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Responsibilities</label>
                <textarea
                  name="responsibilities"
                  value={newInternship.responsibilities || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Benefits</label>
                <textarea
                  name="benefits"
                  value={newInternship.benefits || ''}
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
                  value={newInternship.openings || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={newInternship.duration}
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
                  value={newInternship.stipend}
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
                  value={newInternship.startDate || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Application Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={newInternship.deadline}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {isEdit && (
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={newInternship.status || 'pending'}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              )}
              
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Application Link (Optional)</label>
                <input
                  type="url"
                  name="applyLink"
                  value={newInternship.applyLink}
                  onChange={handleInputChange}
                  placeholder="https://example.com/apply"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={submitting}>
                {isEdit ? 'Update Internship' : 'Post Internship'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Internships</h1>
        <Button onClick={() => setIsPosting(true)}>
          Post New Internship
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : internships.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No internships found.</td>
                </tr>
              ) : (
                internships.map((internship) => (
                  <tr key={internship._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{internship.title}</div>
                      <div className="text-xs text-gray-500">{internship.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {internship.organization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {internship.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        internship.status === 'active' ? 'bg-green-100 text-green-800' :
                        internship.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {internship.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(internship.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditInternship(internship)}
                        className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition-colors"
                      >
                        Edit
                      </button>
                      {internship.status === 'pending' && (
                        <button 
                          onClick={() => handleApproveInternship(internship._id)}
                          className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteInternship(internship._id)}
                        className="text-red-600 hover:text-red-900 px-3 py-1 border border-transparent"
                      >
                        Delete
                      </button>
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

export default Internships;
