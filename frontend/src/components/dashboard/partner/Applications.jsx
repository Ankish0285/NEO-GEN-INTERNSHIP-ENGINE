import React, { useEffect, useState } from 'react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';
import { resolveResumeUrl } from '../../../utils/resolveResumeUrl';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const apps = await api.get('/applications/partner');
        setApplications(apps);
      } catch (e) {
        console.error("Error loading applications", e);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const getResumeUrl = (app) => {
    const resumeUrl = app.resume || app.resumePath || (app.details && app.details.resumePath);
    if (!resumeUrl) return null;
    return resolveResumeUrl(resumeUrl);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Student Applications</h1>
      
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internship</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATS Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">No applications found.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{app.student?.name}</div>
                      <div className="text-xs text-gray-500">{app.student?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.internship?.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {getResumeUrl(app) ? (
                        <a href={getResumeUrl(app)} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-900 underline text-sm font-medium">View Resume</a>
                       ) : (
                         <span className="text-gray-400">No Resume</span>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                      {app.atsScore ? <span className="text-indigo-600">{app.atsScore}% AI Match</span> : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${app.status === 'Accepted' || app.status === 'Selected' ? 'bg-green-100 text-green-800' : 
                          app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                          app.status === 'Shortlisted' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                       <button className="text-blue-600 hover:text-blue-900">Shortlist</button>
                       <button className="text-green-600 hover:text-green-900 mx-2">Select</button>
                       <button className="text-red-600 hover:text-red-900">Reject</button>
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

export default Applications;
