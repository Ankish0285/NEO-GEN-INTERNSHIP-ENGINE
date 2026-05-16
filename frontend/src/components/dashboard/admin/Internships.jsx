import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { api } from '../../../services/api';

const Internships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [newInternship, setNewInternship] = useState({
    title: '',
    organization: '',
    department: '',
    location: '',
    type: 'Remote',
    skills: '',
    description: '',
    eligibility: '',
    duration: '',
    stipend: '',
    deadline: '',
    applyLink: ''
  });

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

  const handlePostInternship = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const internshipData = {
        ...newInternship,
        skills: newInternship.skills.split(',').map(f => f.trim())
      };
      await api.post('/internships', internshipData);
      alert('Internship posted successfully!');
      
      // Reset form and switch to list view
      setNewInternship({
        title: '',
        organization: '',
        department: '',
        location: '',
        type: 'Remote',
        skills: '',
        description: '',
        eligibility: '',
        duration: '',
        stipend: '',
        deadline: '',
        applyLink: ''
      });
      setIsPosting(false);
      fetchInternships();
    } catch (error) {
      console.error(error);
      alert('Failed to post internship: ' + (error.response?.data?.message || error.message));
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
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Post New Internship</h1>
          <Button variant="outline" onClick={() => setIsPosting(false)}>
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
                  rows={4}
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
                <label className="block text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={newInternship.deadline}
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
                  value={newInternship.applyLink}
                  onChange={handleInputChange}
                  placeholder="https://example.com/apply"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={submitting}>
                Post Internship
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
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : internships.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No internships found.</td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
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
