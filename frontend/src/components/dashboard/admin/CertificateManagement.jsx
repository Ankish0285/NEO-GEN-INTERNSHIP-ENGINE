import { useState, useEffect } from 'react';
import { Award, Search, Filter, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAdminCertificates, verifyCertificateAdmin, revokeCertificateAdmin } from '../../../services/careerService';
import Modal from '../../ui/Modal';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  active:  'bg-green-100  text-green-700  border border-green-200',
  revoked: 'bg-red-100   text-red-700    border border-red-200',
};

const STATUS_ICON = {
  pending: <Clock size={12} />,
  active:  <CheckCircle size={12} />,
  revoked: <XCircle size={12} />,
};

const STATUS_FILTERS = [
  { value: 'all',     label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active',  label: 'Active' },
  { value: 'revoked', label: 'Revoked' },
];

const CertificateManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [revokeModal, setRevokeModal] = useState({ open: false, certId: null, reason: '' });
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await getAdminCertificates(params);
      setCertificates(Array.isArray(res) ? res : res?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      toast.error('Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCertificates(); }, [statusFilter]);

  const handleVerify = async (certId) => {
    setVerifyingId(certId);
    try {
      await verifyCertificateAdmin(certId);
      toast.success('Certificate verified! Student has been notified.');
      fetchCertificates();
    } catch (err) {
      toast.error('Failed to verify certificate.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRevoke = async () => {
    const { certId, reason } = revokeModal;
    setRevokeModal({ open: false, certId: null, reason: '' });
    try {
      await revokeCertificateAdmin(certId, reason);
      toast.success('Certificate revoked.');
      fetchCertificates();
    } catch {
      toast.error('Failed to revoke certificate.');
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const filtered = certificates.filter((c) =>
    !searchQuery.trim() ||
    (c.certificateId ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.organization ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const counts = {
    all:     certificates.length,
    pending: certificates.filter(c => c.status === 'pending').length,
    active:  certificates.filter(c => c.status === 'active').length,
    revoked: certificates.filter(c => c.status === 'revoked').length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Award size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-sm text-gray-500">Verify, monitor, and manage student internship certificates</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',   value: counts.all,     color: 'bg-gray-50   border-gray-200  text-gray-700' },
          { label: 'Pending', value: counts.pending, color: 'bg-amber-50  border-amber-200 text-amber-700' },
          { label: 'Active',  value: counts.active,  color: 'bg-green-50  border-green-200 text-green-700' },
          { label: 'Revoked', value: counts.revoked, color: 'bg-red-50    border-red-200   text-red-700'   },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${color}`}>
            <p className="text-2xl font-bold">{loading ? '—' : value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Certificate ID or Organization…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === value
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
                {counts[value] > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === value ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {counts[value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table / Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Certificates Found"
          message={searchQuery ? 'No certificates match your search.' : 'No certificates match the selected filter.'}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Certificate ID</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Organization</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Role</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Issued</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Verified</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((cert) => {
                  const id = cert._id ?? cert.certificateId;
                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {cert.certificateId ?? cert._id}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{cert.organization || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{cert.role || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmt(cert.issuedAt)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmt(cert.verifiedAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[cert.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_ICON[cert.status]}
                          {cert.status ? cert.status.charAt(0).toUpperCase() + cert.status.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {cert.status === 'pending' && (
                            <button
                              onClick={() => handleVerify(id)}
                              disabled={verifyingId === id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <CheckCircle size={13} />
                              {verifyingId === id ? 'Verifying…' : 'Verify'}
                            </button>
                          )}
                          {cert.status !== 'revoked' && (
                            <button
                              onClick={() => setRevokeModal({ open: true, certId: id, reason: '' })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg border border-red-200 transition-colors"
                            >
                              <XCircle size={13} />
                              Revoke
                            </button>
                          )}
                          {cert.status === 'revoked' && (
                            <span className="text-xs text-gray-400 italic">Revoked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Showing {filtered.length} of {certificates.length} certificates
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      <Modal
        isOpen={revokeModal.open}
        onClose={() => setRevokeModal({ open: false, certId: null, reason: '' })}
        title="Revoke Certificate"
      >
        <div className="space-y-4 p-1">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">
              This will immediately invalidate the certificate. The student will be notified and the certificate will show as <strong>Revoked</strong> on the public verification page.
            </p>
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium block mb-1.5">
              Reason for Revocation <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={revokeModal.reason}
              onChange={(e) => setRevokeModal(p => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Duplicate certificate, Data error…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setRevokeModal({ open: false, certId: null, reason: '' })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRevoke}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              Revoke Certificate
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CertificateManagement;
