import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const Internships = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyInternships = async () => {
    try {
      setLoading(true);
      const data = await api.get('/internships/mine');
      setInternships(data);
    } catch (error) {
      console.error('Error fetching partner internships:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInternships();
  }, []);

  const handleEdit = (id) => {
    navigate(`/partner/dashboard/post-internship?edit=${id}`);
  };

  const handlePostNew = () => {
    navigate('/partner/dashboard/post-internship');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Internships</h1>
        <Button onClick={handlePostNew}>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Openings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">Loading your internships...</td>
                </tr>
              ) : internships.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                    <div className="py-6">
                      <p className="mb-3 text-gray-600">You have not posted any internships yet.</p>
                      <Button onClick={handlePostNew}>Post Your First Internship</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                internships.map((internship) => (
                  <tr key={internship._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{internship.title}</div>
                      <div className="text-xs text-gray-500">{internship.type || internship.workMode || 'Unspecified'}</div>
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
                        internship.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        internship.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {internship.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {internship.openings || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {internship.deadline ? new Date(internship.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(internship._id)}
                        className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition-colors"
                      >
                        Edit
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
