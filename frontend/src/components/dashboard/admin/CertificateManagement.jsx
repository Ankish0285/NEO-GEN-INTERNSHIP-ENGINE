import { useState, useEffect, useRef } from 'react';
import { Award, Search, Filter, CheckCircle, XCircle, Clock, Plus, X, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getAdminCertificates,
  verifyCertificateAdmin,
  revokeCertificateAdmin,
  adminIssueCertificate,
  searchStudentsForCert,
} from '../../../services/careerService';
import Modal from '../../ui/Modal';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  pending: 'bg-[#fff4e8] text-[#e68a2e] border border-amber-200',
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

// ─── Empty form ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  role: '', organization: '', duration: '', skills: '', notes: '',
};

const CertificateManagement = () => {
  // List state
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [revokeModal, setRevokeModal] = useState({ open: false, certId: null, reason: '' });

  // Issue certificate modal state
  const [issueModal, setIssueModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchTimer = useRef(null);

  // ── Fetch certificates ───────────────────────────────────────────────────────
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await getAdminCertificates(params);
      setCertificates(Array.isArray(res) ? res : res?.data ?? []);
    } catch {
      toast.error('Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchCertificates(); }, [statusFilter]);

  // ── Student search (debounced) ────────────────────────────────────────────────
  useEffect(() => {
    if (!studentSearch.trim() || studentSearch.trim().length < 2) {
      setStudentResults([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const res = await searchStudentsForCert(studentSearch.trim());
        setStudentResults(res?.data ?? []);
      } catch {
        setStudentResults([]);
      } finally {
        setSearchingStudents(false);
      }
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [studentSearch]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handleVerify = async (certId) => {
    setVerifyingId(certId);
    try {
      await verifyCertificateAdmin(certId);
      toast.success('Certificate verified! Student notified.');
      fetchCertificates();
    } catch {
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

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { toast.error('Please select a student.'); return; }
    if (!form.role.trim()) { toast.error('Role is required.'); return; }
    if (!form.organization.trim()) { toast.error('Organization is required.'); return; }
    setSubmitting(true);
    try {
      await adminIssueCertificate({
        studentId: selectedStudent._id,
        role: form.role.trim(),
        organization: form.organization.trim(),
        duration: form.duration.trim(),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        notes: form.notes.trim(),
      });
      toast.success(`Certificate issued for ${selectedStudent.name}!`);
      setIssueModal(false);
      setForm(EMPTY_FORM);
      setSelectedStudent(null);
      setStudentSearch('');
      setStudentResults([]);
      fetchCertificates();
    } catch (err) {
      toast.error(err?.message || 'Failed to issue certificate.');
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff4e8] flex items-center justify-center">
            <Award size={20} className="text-[#e68a2e]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Certificate Management</h1>
            <p className="text-sm text-gray-500">Issue, verify, and manage student certificates</p>
          </div>
        </div>
        <button
          onClick={() => setIssueModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF9933] hover:bg-[#e68a2e] text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} />
          Issue Certificate
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',   value: counts.all,     color: 'bg-gray-50   border-gray-200  text-gray-700' },
          { label: 'Pending', value: counts.pending, color: 'bg-[#fff4e8] border-amber-200 text-[#e68a2e]' },
          { label: 'Active',  value: counts.active,  color: 'bg-[#e8f5e6] border-green-200 text-[#138808]' },
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
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100"
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
                    ? 'bg-[#FF9933] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
                {counts[value] > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === value ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>{counts[value]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Certificates Found"
          message={searchQuery ? 'No certificates match your search.' : 'No certificates yet. Use "Issue Certificate" to create one.'}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Certificate ID','Organization','Role','Issued','Verified','Status','Actions'].map(h => (
                    <th key={h} className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((cert) => {
                  const id = cert._id ?? cert.certificateId;
                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">{cert.certificateId ?? '—'}</code>
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#138808] hover:bg-[#0f7006] disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
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
                          {cert.status === 'revoked' && <span className="text-xs text-gray-400 italic">Revoked</span>}
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

      {/* ── Issue Certificate Modal ──────────────────────────────────────────── */}
      <Modal isOpen={issueModal} onClose={() => { setIssueModal(false); setSelectedStudent(null); setStudentSearch(''); setStudentResults([]); setForm(EMPTY_FORM); }} title="Issue Certificate to Student">
        <form onSubmit={handleIssue} className="space-y-4 p-1">

          {/* Student Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Search Student <span className="text-red-500">*</span>
            </label>
            {selectedStudent ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-sm shrink-0">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedStudent.email}</p>
                  {selectedStudent.university && <p className="text-xs text-gray-400">{selectedStudent.university}</p>}
                </div>
                <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(''); setStudentResults([]); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Type student name or email…"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100"
                  />
                  {searchingStudents && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching…</span>}
                </div>
                {studentResults.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {studentResults.map((s) => (
                      <button key={s._id} type="button"
                        onClick={() => { setSelectedStudent(s); setStudentSearch(''); setStudentResults([]); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fff4e8] text-left transition-colors border-b border-gray-100 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-[#fff4e8] flex items-center justify-center text-[#e68a2e] font-bold text-xs shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400 truncate">{s.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {studentSearch.trim().length >= 2 && !searchingStudents && studentResults.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1 px-1">No students found.</p>
                )}
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role / Position <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.role}
              onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
              placeholder="e.g. Frontend Developer Intern"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100"
              required
            />
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Organization / Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.organization}
              onChange={(e) => setForm(p => ({ ...p, organization: e.target.value }))}
              placeholder="e.g. NEO GEN Internship Engine"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100"
              required
            />
          </div>

          {/* Duration + Skills (side by side on md+) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
              <input
                type="text" value={form.duration}
                onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))}
                placeholder="e.g. 3 months"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills (comma-separated)</label>
              <input
                type="text" value={form.skills}
                onChange={(e) => setForm(p => ({ ...p, skills: e.target.value }))}
                placeholder="e.g. React, Node.js"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (internal)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Internal notes about this certificate…"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100 resize-none"
            />
          </div>

          {/* Info note */}
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            ℹ️ Admin-issued certificates are automatically <strong>Active</strong> and verified. The student will be notified immediately.
          </p>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button"
              onClick={() => { setIssueModal(false); setSelectedStudent(null); setStudentSearch(''); setStudentResults([]); setForm(EMPTY_FORM); }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !selectedStudent}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#FF9933] hover:bg-[#e68a2e] disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
              <Award size={15} />
              {submitting ? 'Issuing…' : 'Issue Certificate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Revoke Modal ─────────────────────────────────────────────────────── */}
      <Modal isOpen={revokeModal.open} onClose={() => setRevokeModal({ open: false, certId: null, reason: '' })} title="Revoke Certificate">
        <div className="space-y-4 p-1">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
            <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">This will immediately invalidate the certificate. The student will be notified and the public verification page will show <strong>Revoked</strong>.</p>
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium block mb-1.5">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text" value={revokeModal.reason}
              onChange={(e) => setRevokeModal(p => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Duplicate certificate, Data error…"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setRevokeModal({ open: false, certId: null, reason: '' })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
            <button onClick={handleRevoke}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors">Revoke</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CertificateManagement;
