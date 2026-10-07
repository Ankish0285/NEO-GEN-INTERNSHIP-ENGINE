import { useState, useEffect } from 'react';
import { Award, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllCertificates, verifyCertificateAdmin, revokeCertificate } from '../../../services/careerService';
import { api } from '../../../services/api';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

const STATUS_BADGE = {
  pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  active: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  revoked: 'bg-red-500/20 text-red-300 border border-red-500/40',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'revoked', label: 'Revoked' },
];

const CertificateManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [revokeModal, setRevokeModal] = useState({ open: false, certId: null });

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await getAllCertificates(params);
      setCertificates(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      toast.error('Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter]);

  const handleVerify = async (id) => {
    try {
      await verifyCertificateAdmin(id);
      toast.success('Certificate verified successfully!');
      fetchCertificates();
    } catch (err) {
      console.error('Verification failed:', err);
      toast.error('Failed to verify certificate.');
    }
  };

  const handleRevoke = async () => {
    const { certId } = revokeModal;
    setRevokeModal({ open: false, certId: null });
    try {
      await revokeCertificate(certId);
      toast.success('Certificate revoked.');
      fetchCertificates();
    } catch (err) {
      console.error('Revocation failed:', err);
      toast.error('Failed to revoke certificate.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredCerts = certificates.filter((cert) => {
    if (!searchQuery.trim()) return true;
    return (cert.certificateId ?? '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Certificate ID…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-white/50 shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === value
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-white/10 text-white/60 hover:bg-white/15 border border-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      ) : filteredCerts.length === 0 ? (
        <EmptyState
          title="No Certificates Found"
          message="No certificates match your current filters."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl neo-glass">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/60 font-medium px-4 py-3">Certificate ID</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Student</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Organization</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Role</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Issued</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Status</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCerts.map((cert) => (
                <tr key={cert._id ?? cert.certificateId} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <code className="text-white/80 font-mono text-xs bg-white/10 px-2 py-0.5 rounded">
                      {cert.certificateId ?? cert._id}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{cert.studentName}</td>
                  <td className="px-4 py-3 text-white/80">{cert.organization}</td>
                  <td className="px-4 py-3 text-white/70">{cert.role}</td>
                  <td className="px-4 py-3 text-white/60">{formatDate(cert.issuedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[cert.status] ?? 'bg-white/10 text-white/60'}`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {cert.status === 'pending' && (
                        <Button
                          variant="success"
                          onClick={() => handleVerify(cert._id ?? cert.certificateId)}
                        >
                          Verify
                        </Button>
                      )}
                      {cert.status !== 'revoked' && (
                        <Button
                          variant="danger"
                          onClick={() => setRevokeModal({ open: true, certId: cert._id ?? cert.certificateId })}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revoke confirmation modal */}
      <Modal
        isOpen={revokeModal.open}
        onClose={() => setRevokeModal({ open: false, certId: null })}
        title="Revoke Certificate"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            Are you sure you want to revoke this certificate? This action will immediately
            invalidate the certificate for the student.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRevokeModal({ open: false, certId: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRevoke}>
              Revoke Certificate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CertificateManagement;
