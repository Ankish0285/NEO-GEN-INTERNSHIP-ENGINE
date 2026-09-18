import React, { useEffect, useState } from 'react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';
import { resolveResumeUrl } from '../../../utils/resolveResumeUrl';

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Applied:       'bg-blue-100 text-blue-800',
    Viewed:        'bg-gray-100 text-gray-700',
    'Under Review':'bg-amber-100 text-amber-800',
    Shortlisted:   'bg-indigo-100 text-indigo-800',
    Interview:     'bg-violet-100 text-violet-800',
    Accepted:      'bg-green-100 text-green-800',
    Selected:      'bg-emerald-100 text-emerald-800',
    Rejected:      'bg-red-100 text-red-800',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>
      {status}
    </span>
  );
};

// ─── Context-aware action buttons ─────────────────────────────────────────────
const ActionButtons = ({ app, onUpdate }) => {
  const s = app.status;

  if (s === 'Selected' || s === 'Rejected') {
    return <span className="text-xs text-gray-400 italic">No further action</span>;
  }

  const canShortlist = s === 'Applied' || s === 'Viewed' || s === 'Under Review';
  const canInterview = s === 'Shortlisted' || s === 'Accepted';
  const canSelect    = s === 'Interview';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {canShortlist && (
        <button
          onClick={() => onUpdate(app._id, 'Shortlisted')}
          className="px-2 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
        >
          Shortlist
        </button>
      )}
      {canInterview && (
        <button
          onClick={() => onUpdate(app._id, 'Interview')}
          className="px-2 py-1 text-xs font-semibold rounded bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors"
        >
          Interview
        </button>
      )}
      {canSelect && (
        <button
          onClick={() => onUpdate(app._id, 'Selected')}
          className="px-2 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
        >
          Select
        </button>
      )}
      <button
        onClick={() => onUpdate(app._id, 'Rejected')}
        className="px-2 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
      >
        Reject
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const apps = await api.get('/applications/partner');
        setApplications(apps);
      } catch (e) {
        console.error('Error loading applications', e);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.put(`/applications/${id}/status`, { status: newStatus });
      setApplications(prev =>
        prev.map(app => (app._id === id ? { ...app, status: newStatus } : app))
      );
      showToast(`Status updated to "${newStatus}"`);
    } catch (error) {
      const msg = error?.data?.message || error?.message || 'Failed to update status';
      showToast(msg, 'error');
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getResumeUrl = (app) => {
    const resumeUrl = app.resume || app.resumePath || (app.details && app.details.resumePath);
    if (!resumeUrl) return null;
    return resolveResumeUrl(resumeUrl);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900">Student Applications</h1>

      {/* Workflow legend */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500 items-center">
        <span className="font-semibold text-gray-600">Workflow:</span>
        {['Applied', '→', 'Shortlisted', '→', 'Interview', '→', 'Selected'].map((s, i) => (
          <span key={i} className={s === '→' ? 'text-gray-400' : 'px-2 py-0.5 rounded-full bg-gray-100 font-medium'}>{s}</span>
        ))}
        <span className="ml-2 px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">Reject at any stage</span>
      </div>

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
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No applications found.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className={updatingId === app._id ? 'opacity-60 pointer-events-none' : ''}>
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
                        <a href={getResumeUrl(app)} target="_blank" rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 underline text-sm font-medium">
                          View Resume
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No Resume</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {app.atsScore
                        ? <span className="text-indigo-600">{app.atsScore}% AI Match</span>
                        : <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <ActionButtons app={app} onUpdate={handleStatusUpdate} />
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
