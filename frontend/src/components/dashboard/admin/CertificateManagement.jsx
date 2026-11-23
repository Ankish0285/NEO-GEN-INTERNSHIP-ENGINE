import { useState, useEffect, useRef } from 'react';
import { Award, Search, Filter, CheckCircle, XCircle, Clock, Plus, X, User, Upload, Wand2, Download, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getAdminCertificates,
  verifyCertificateAdmin,
  revokeCertificateAdmin,
  adminIssueCertificate,
  searchStudentsForCert,
  uploadCertificateAdmin,
  generateCertificateAdmin,
} from '../../../services/careerService';
import Modal from '../../ui/Modal';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';
import CertificatePreview from '../../career/CertificatePreview';

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

const TEMPLATES = [
  { id: 'classic', label: 'Classic', desc: 'Cream/gold formal layout' },
  { id: 'modern',  label: 'Modern',  desc: 'Dark gradient, clean sans-serif' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];

const EMPTY_FORM = {
  role: '', organization: '', duration: '', skills: '', notes: '',
  title: '', description: '', templateId: 'classic',
};

// ─── StudentSearchInput ────────────────────────────────────────────────────────
const StudentSearchInput = ({ selectedStudent, onSelect, onClear, fetchStudents }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetchStudents(q.trim());
        setResults(res?.data ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [q, fetchStudents]);

  if (selectedStudent) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-sm shrink-0">
          {selectedStudent.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{selectedStudent.name}</p>
          <p className="text-xs text-gray-500 truncate">{selectedStudent.email}</p>
        </div>
        <button type="button" onClick={() => { onClear(); setQ(''); setResults([]); }}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Type student name or email…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100" />
        {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching…</span>}
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((s) => (
            <button key={s._id} type="button"
              onClick={() => { onSelect(s); setQ(''); setResults([]); }}
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
      {q.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-xs text-gray-400 mt-1 px-1">No students found.</p>
      )}
    </div>
  );
};

// ─── CommonFields ──────────────────────────────────────────────────────────────
const CommonFields = ({ form, setForm }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role / Position <span className="text-red-500">*</span></label>
        <input type="text" value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
          placeholder="e.g. Frontend Developer Intern"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization <span className="text-red-500">*</span></label>
        <input type="text" value={form.organization} onChange={(e) => setForm(p => ({ ...p, organization: e.target.value }))}
          placeholder="e.g. NEO GEN"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
        <input type="text" value={form.duration} onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))}
          placeholder="e.g. 3 months"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills (comma-separated)</label>
        <input type="text" value={form.skills} onChange={(e) => setForm(p => ({ ...p, skills: e.target.value }))}
          placeholder="e.g. React, Node.js"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100" />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Certificate Title</label>
      <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
        placeholder="Internship Completion Certificate"
        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Internal Notes</label>
      <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
        placeholder="Internal notes…" rows={2}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100 resize-none" />
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const CertificateManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [revokeModal, setRevokeModal] = useState({ open: false, certId: null, reason: '' });
  const [issueModal, setIssueModal] = useState(false);
  const [issueTab, setIssueTab] = useState('generate'); // 'upload' | 'generate'
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Upload tab state
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const resetModal = () => {
    setForm(EMPTY_FORM);
    setSelectedStudent(null);
    setFile(null);
    setFilePreviewUrl(null);
    setIssueTab('generate');
  };

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await getAdminCertificates(params);
      setCertificates(Array.isArray(res) ? res : res?.data ?? []);
    } catch {
      toast.error('Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCertificates(); }, [statusFilter]); // eslint-disable-line

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

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error('Invalid file type. Allowed: PNG, JPG, JPEG, WebP, PDF');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum 10 MB.');
      return;
    }
    setFile(f);
    setFilePreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { toast.error('Please select a student.'); return; }
    if (!form.role.trim()) { toast.error('Role is required.'); return; }
    if (!form.organization.trim()) { toast.error('Organization is required.'); return; }

    if (issueTab === 'upload' && !file) {
      toast.error('Please upload a certificate file.');
      return;
    }

    setSubmitting(true);
    try {
      const skillsArr = form.skills.split(',').map(s => s.trim()).filter(Boolean);

      if (issueTab === 'upload') {
        const fd = new FormData();
        fd.append('certificate', file);
        fd.append('studentId', selectedStudent._id);
        fd.append('role', form.role.trim());
        fd.append('organization', form.organization.trim());
        fd.append('duration', form.duration.trim());
        skillsArr.forEach(s => fd.append('skills[]', s));
        fd.append('internalNotes', form.notes.trim());
        fd.append('title', form.title.trim() || 'Internship Completion Certificate');
        fd.append('description', form.description?.trim() || '');
        await uploadCertificateAdmin(fd);
      } else {
        await generateCertificateAdmin({
          studentId: selectedStudent._id,
          role: form.role.trim(),
          organization: form.organization.trim(),
          duration: form.duration.trim(),
          skills: skillsArr,
          notes: form.notes.trim(),
          title: form.title.trim() || 'Internship Completion Certificate',
          description: form.description?.trim() || '',
          templateId: form.templateId,
        });
      }

      toast.success(`Certificate issued for ${selectedStudent.name}!`);
      setIssueModal(false);
      resetModal();
      fetchCertificates();
    } catch (err) {
      toast.error(err?.message || 'Failed to issue certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const filtered = searchQuery.trim()
    ? certificates.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          (c.certificateId ?? '').toLowerCase().includes(q) ||
          (c.organization ?? '').toLowerCase().includes(q) ||
          (c.student?.name ?? '').toLowerCase().includes(q) ||
          (c.student?.email ?? '').toLowerCase().includes(q)
        );
      })
    : certificates;

  const counts = {
    all:     certificates.length,
    pending: certificates.filter(c => c.status === 'pending').length,
    active:  certificates.filter(c => c.status === 'active').length,
    revoked: certificates.filter(c => c.status === 'revoked').length,
  };

  const previewSkills = form.skills.split(',').map(s => s.trim()).filter(Boolean);

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
        <button onClick={() => setIssueModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF9933] hover:bg-[#e68a2e] text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> Issue Certificate
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
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCertificates()}
            placeholder="Search by name, cert ID, or org…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-amber-100" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button key={value} onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === value ? 'bg-[#FF9933] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
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
        <EmptyState title="No Certificates Found"
          message={searchQuery ? 'No certificates match your search.' : 'No certificates yet. Use "Issue Certificate" to create one.'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Cert ID','Student','Organization','Role','Issued','Status','Actions'].map(h => (
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
                      <td className="px-4 py-3 text-gray-800">
                        <div>
                          <p className="font-medium text-sm">{cert.student?.name ?? '—'}</p>
                          {cert.student?.email && <p className="text-xs text-gray-400">{cert.student.email}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{cert.organization || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{cert.role || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmt(cert.issueDate ?? cert.issuedAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[cert.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_ICON[cert.status]}
                          {cert.status ? cert.status.charAt(0).toUpperCase() + cert.status.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Download */}
                          {cert.fileUrl ? (
                            <a href={cert.fileUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 transition-colors">
                              <Download size={12} /> Download
                            </a>
                          ) : null}
                          {/* Verify link */}
                          {(cert.verificationId || cert.certificateId) && (
                            <a
                              href={cert.verificationId ? `/verify/${cert.verificationId}` : `/certificate/verify/${cert.certificateId}`}
                              target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#e8f5e6] hover:bg-green-100 text-[#138808] text-xs font-medium rounded-lg border border-green-200 transition-colors">
                              <ExternalLink size={12} /> Verify
                            </a>
                          )}
                          {/* Admin verify */}
                          {cert.status === 'pending' && (
                            <button onClick={() => handleVerify(id)} disabled={verifyingId === id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#138808] hover:bg-[#0f7006] disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors">
                              <CheckCircle size={13} />
                              {verifyingId === id ? 'Verifying…' : 'Verify'}
                            </button>
                          )}
                          {/* Revoke */}
                          {cert.status !== 'revoked' && (
                            <button onClick={() => setRevokeModal({ open: true, certId: id, reason: '' })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg border border-red-200 transition-colors">
                              <XCircle size={13} /> Revoke
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
      <Modal isOpen={issueModal} onClose={() => { setIssueModal(false); resetModal(); }} title="Issue Certificate to Student">
        <form onSubmit={handleSubmit} className="space-y-4 p-1">

          {/* Student Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Search Student <span className="text-red-500">*</span>
            </label>
            <StudentSearchInput
              selectedStudent={selectedStudent}
              onSelect={setSelectedStudent}
              onClear={() => setSelectedStudent(null)}
              fetchStudents={searchStudentsForCert}
            />
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'generate', label: 'Generate Certificate', icon: <Wand2 size={14} /> },
              { key: 'upload',   label: 'Upload Certificate',   icon: <Upload size={14} /> },
            ].map(({ key, label, icon }) => (
              <button key={key} type="button" onClick={() => setIssueTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  issueTab === key ? 'bg-white text-[#FF9933] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Common fields */}
          <CommonFields form={form} setForm={setForm} />

          {/* Upload tab */}
          {issueTab === 'upload' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Certificate File <span className="text-red-500">*</span>
                <span className="ml-1 text-xs text-gray-400 font-normal">(PNG, JPG, JPEG, WebP, PDF — max 10 MB)</span>
              </label>
              <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handleFileChange} className="hidden" />
              {!file ? (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-[#FF9933] rounded-xl p-6 text-center text-gray-500 hover:text-[#FF9933] transition-colors">
                  <Upload size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Click to upload certificate</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG, WebP, or PDF up to 10 MB</p>
                </button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                  {file.type === 'application/pdf' ? (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-gray-700">📄 {file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <img src={filePreviewUrl} alt="Preview" className="max-h-48 object-contain mx-auto rounded-lg border border-gray-200" />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate">{file.name}</p>
                    <button type="button"
                      onClick={() => { setFile(null); setFilePreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">Remove</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate tab */}
          {issueTab === 'generate' && (
            <div className="space-y-3">
              {/* Template selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Template</label>
                <div className="flex gap-2">
                  {TEMPLATES.map(({ id, label, desc }) => (
                    <button key={id} type="button"
                      onClick={() => setForm(p => ({ ...p, templateId: id }))}
                      className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                        form.templateId === id
                          ? 'border-[#FF9933] bg-[#fff4e8]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <p className="font-semibold text-sm text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              {selectedStudent && form.role && form.organization && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Live Preview</label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto max-h-64">
                    <div className="transform scale-50 origin-top-left" style={{ width: '200%', transformOrigin: 'top left' }}>
                      <CertificatePreview
                        templateId={form.templateId}
                        studentName={selectedStudent.name}
                        certificateId="NEOGEN-CERT-PREVIEW"
                        role={form.role}
                        organization={form.organization}
                        duration={form.duration}
                        skills={previewSkills}
                        issueDate={new Date()}
                        issuerName="NEO GEN Admin"
                        title={form.title || 'Internship Completion Certificate'}
                        description={form.description || ''}
                        qrCodeData="https://neogeninternshipengine.me/verify/preview"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            ℹ️ Admin-issued certificates are automatically <strong>Active</strong>. The student will be notified immediately.
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => { setIssueModal(false); resetModal(); }}
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
            <p className="text-sm text-red-700">This will immediately invalidate the certificate. The public verification page will show <strong>Revoked</strong>.</p>
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium block mb-1.5">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={revokeModal.reason}
              onChange={(e) => setRevokeModal(p => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Duplicate certificate, Data error…"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" />
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
