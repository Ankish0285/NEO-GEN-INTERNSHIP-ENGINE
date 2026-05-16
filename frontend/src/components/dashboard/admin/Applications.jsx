import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';
import ApplicationDetailsModal from './ApplicationDetailsModal';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInternshipFilter, setSelectedInternshipFilter] = useState('');
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchApplications = async (internshipId = '') => {
    try {
      setLoading(true);
      const url = internshipId ? `/applications?internshipId=${internshipId}` : '/applications';
      const data = await api.get(url);
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(selectedInternshipFilter);
  }, [selectedInternshipFilter]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/applications/${id}/status`, { status: newStatus });
      // Update local state to avoid full reload
      setApplications(prev => prev.map(app => 
        app._id === id ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update application status');
    }
  };

  const openApplicationDetails = async (applicationId) => {
    setSelectedApplication(null);
    setLoadingDetails(true);
    setShowApplicationDetails(true);

    try {
      const data = await api.get(`/applications/${applicationId}`);
      setSelectedApplication(data);
    } catch (error) {
      console.error("Failed to fetch application details", error);
      const local = applications.find(a => a._id === applicationId);
      setSelectedApplication(local || null);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Review Applications</h1>
        {/* Add filter dropdown here if needed */}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internship</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No applications found.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{app.student?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{app.student?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{app.internship?.title || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{app.internship?.organization}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${app.status === 'Accepted' ? 'bg-green-100 text-green-800' : 
                          app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        onClick={() => openApplicationDetails(app._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(app._id, 'Accepted')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(app._id, 'Rejected')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Premium Application Details Modal */}
      <ApplicationDetailsModal
        isOpen={showApplicationDetails}
        onClose={() => setShowApplicationDetails(false)}
        application={selectedApplication}
        isLoading={loadingDetails}
      />
    </div>
  );
};

export default Applications;
