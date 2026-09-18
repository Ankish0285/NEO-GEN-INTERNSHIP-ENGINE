import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';
import ApplicationDetailsModal from './ApplicationDetailsModal';

// ─── Status badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Applied:       'bg-blue-100 text-blue-800',
    Viewed:        'bg-gray-100 text-gray-700',
    'Under Review':'bg-amber-100 text-amber-800',
    Shortlisted:   'bg-indigo-100 text-indigo-800',
    Interview:     'bg-violet-100 text-violet-800',
    Accepted:      'bg-green-100 text-green-800',   // legacy
    Selected:      'bg-emerald-100 text-emerald-800',
    Rejected:      'bg-red-100 text-red-800',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cls}`}>
      {status}
    </span>
  );
};

// ─── Context-aware action buttons ────────────────────────────────────────────
const ActionButtons = ({ app, onUpdate, onView }) => {
  const s = app.status;

  // Fully rejected — no further action
  if (s === 'Rejected') {
    return (
      <button onClick={() => onView(app._id)} className="text-blue-600 hover:text-blue-900 text-sm font-medium">
        View
      </button>
    );
  }

  // Selected — can still be rejected (e.g. admin made a mistake)
  if (s === 'Selected') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => onView(app._id)} className="text-blue-600 hover:text-blue-900 text-sm font-medium">
          View
        </button>
        <button
          onClick={() => onUpdate(app._id, 'Rejected')}
          className="px-2.5 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
        >
          Reject
        </button>
      </div>
    );
  }

  // Accepted (legacy) – treat same as shortlisted for transitions
  const canShortlist  = s === 'Applied' || s === 'Viewed' || s === 'Under Review';
  const canInterview  = s === 'Shortlisted' || s === 'Accepted';
  const canSelect     = s === 'Interview';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => onView(app._id)} className="text-blue-600 hover:text-blue-900 text-sm font-medium">
        View
      </button>

      {canShortlist && (
        <button
          onClick={() => onUpdate(app._id, 'Shortlisted')}
          className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
        >
          Shortlist
        </button>
      )}

      {canInterview && (
        <button
          onClick={() => onUpdate(app._id, 'Interview')}
          className="px-2.5 py-1 text-xs font-semibold rounded bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors"
        >
          Interview
        </button>
      )}

      {canSelect && (
        <button
          onClick={() => onUpdate(app._id, 'Selected')}
          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
        >
          Select
        </button>
      )}

      <button
        onClick={() => onUpdate(app._id, 'Rejected')}
        className="px-2.5 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
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
  const [selectedInternshipFilter, setSelectedInternshipFilter] = useState('');
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  const openApplicationDetails = async (applicationId) => {
    setSelectedApplication(null);
    setLoadingDetails(true);
    setShowApplicationDetails(true);
    try {
      const data = await api.get(`/applications/${applicationId}`);
      setSelectedApplication(data);
    } catch (error) {
      console.error('Failed to fetch application details', error);
      const local = applications.find(a => a._id === applicationId);
      setSelectedApplication(local || null);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Review Applications</h1>
      </div>

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
                  <tr key={app._id} className={updatingId === app._id ? 'opacity-60 pointer-events-none' : ''}>
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
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <ActionButtons
                        app={app}
                        onUpdate={handleStatusUpdate}
                        onView={openApplicationDetails}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
