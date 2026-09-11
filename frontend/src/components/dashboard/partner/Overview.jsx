import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../ui/Card';
import { api } from '../../../services/api';

const Overview = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    activeInternships: 0,
    totalApplications: 0,
    pendingApplications: 0,
    recentInternships: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const data = await api.get('/dashboard/partner-summary');
        setSummary({
          activeInternships: data.activeInternships ?? 0,
          totalApplications: data.totalApplications ?? 0,
          pendingApplications: data.pendingApplications ?? 0,
          recentInternships: data.recentInternships ?? [],
        });
      } catch (e) {
        console.error('Error loading partner summary', e);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const internships = summary.recentInternships;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Partner Overview</h1>
      <p className="text-sm text-gray-500">Your organization&apos;s internships and applications</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">Active Internships</h3>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {loading ? '...' : summary.activeInternships}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Applications</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {loading ? '...' : summary.totalApplications}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">Pending Review</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {loading ? '...' : summary.pendingApplications}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">My Internships</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {internship.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(internship.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (internship.status || 'active') === 'active' ? 'bg-green-100 text-green-800' :
                        (internship.status || 'active') === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(internship.status || 'Active').charAt(0).toUpperCase() + (internship.status || 'Active').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/partner/dashboard/post-internship?edit=${internship._id}`)}
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

export default Overview;
