import { useState, useEffect, useRef } from 'react';
import { Award, CheckCircle2, Clock, AlertCircle, Plus, Upload, Wand2, X, User, Download, Search, Settings, Image, PenLine } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getPartnerCompletions,
  getPartnerCertificates,
  uploadCertificatePartner,
  generateCertificatePartner,
  searchStudentsForPartner,
  getPartnerCertSettings,
  updatePartnerCertSettings,
  uploadPartnerCertLogo,
  uploadPartnerCertSignature,
  getPublicNeogenBranding,
} from '../../../services/careerService';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';
import Modal from '../../ui/Modal';
import CertificatePreview from '../../career/CertificatePreview';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TEMPLATES = [
  { id: 'classic', label: 'Classic', desc: 'Cream/gold formal layout' },
  { id: 'modern',  label: 'Modern',  desc: 'Dark gradient, clean sans-serif' },
];

const EMPTY_FORM = {
  role: '', organization: '', duration: '', skills: '', notes: '',
  title: '', description: '', templateId: 'classic',
};

// ─── StudentSearchInput (same logic as admin, but uses partner endpoint) ───────
const StudentSearchInput = ({ selectedStudent, onSelect, onClear, fetchFn }) => {
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
        const res = await fetchFn(q.trim());
        setResults(res?.data ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [q, fetchFn]);

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
          placeholder="Search students from your internships…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100" />
        {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching…</span>}
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((s) => (
            <button key={s._id} type="button"
              onClick={() => { onSelect(s); setQ(''); setResults([]); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-left transition-colors border-b border-gray-100 last:border-0">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs shrink-0">
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
        <p className="text-xs text-gray-400 mt-1 px-1">No eligible students found.</p>
      )}
    </div>
  );
};

// ─── IssueCertificateModal ─────────────────────────────────────────────────────
const IssueCertificateModal = ({
  isOpen, onClose, partnerOrg, prefillStudent = null, onSuccess,
  neogenBranding = null, partnerBranding = null,
}) => {
  const [issueTab, setIssueTab] = useState('generate');
  const [form, setForm] = useState({ ...EMPTY_FORM, organization: partnerOrg || '' });
  const [selectedStudent, setSelectedStudent] = useState(prefillStudent);
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Sync prefill on open
  useEffect(() => {
    if (isOpen) {
      setSelectedStudent(prefillStudent);
      setForm({ ...EMPTY_FORM, organization: partnerOrg || '' });
      setFile(null);
      setFilePreviewUrl(null);
      setIssueTab('generate');
    }
  }, [isOpen, prefillStudent, partnerOrg]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) { toast.error('Invalid file type.'); return; }
    if (f.size > MAX_FILE_SIZE) { toast.error('File too large. Maximum 10 MB.'); return; }
    setFile(f);
    setFilePreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { toast.error('Please select a student.'); return; }
    if (!form.role.trim()) { toast.error('Role is required.'); return; }
    if (!form.organization.trim()) { toast.error('Organization is required.'); return; }
    if (issueTab === 'upload' && !file) { toast.error('Please upload a certificate file.'); return; }

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
        await uploadCertificatePartner(fd);
      } else {
        await generateCertificatePartner({
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
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to issue certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  const previewSkills = form.skills.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Issue Certificate">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        {/* Student Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Student <span className="text-red-500">*</span>
          </label>
          <StudentSearchInput
            selectedStudent={selectedStudent}
            onSelect={setSelectedStudent}
            onClear={() => setSelectedStudent(null)}
            fetchFn={searchStudentsForPartner}
          />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { key: 'generate', label: 'Generate', icon: <Wand2 size={14} /> },
            { key: 'upload',   label: 'Upload',   icon: <Upload size={14} /> },
          ].map(({ key, label, icon }) => (
            <button key={key} type="button" onClick={() => setIssueTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                issueTab === key ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Common fields */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
              <input type="text" value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                placeholder="e.g. Backend Developer Intern"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization <span className="text-red-500">*</span></label>
              <input type="text" value={form.organization}
                onChange={(e) => setForm(p => ({ ...p, organization: e.target.value }))}
                placeholder="Your organization"
                // Partners can't change the org to something else — they should use their own org
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 bg-amber-50" required />
              {partnerOrg && (
                <p className="text-xs text-amber-700 mt-0.5">Pre-filled from your organization profile.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
              <input type="text" value={form.duration} onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))}
                placeholder="e.g. 3 months"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills (comma-separated)</label>
              <input type="text" value={form.skills} onChange={(e) => setForm(p => ({ ...p, skills: e.target.value }))}
                placeholder="e.g. React, Node.js"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Internal Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2} placeholder="Internal notes…"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 resize-none" />
          </div>
        </div>

        {/* Upload tab content */}
        {issueTab === 'upload' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Certificate File <span className="text-red-500">*</span>
            </label>
            <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handleFileChange} className="hidden" />
            {!file ? (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-xl p-6 text-center text-gray-500 hover:text-amber-600 transition-colors">
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

        {/* Generate tab content */}
        {issueTab === 'generate' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Template</label>
              <div className="flex gap-2">
                {TEMPLATES.map(({ id, label, desc }) => (
                  <button key={id} type="button" onClick={() => setForm(p => ({ ...p, templateId: id }))}
                    className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                      form.templateId === id ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <p className="font-semibold text-sm text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

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
                      issuerName={partnerOrg || 'Partner Organization'}
                      title={form.title || 'Internship Completion Certificate'}
                      description={form.description || ''}
                      qrCodeData="https://neogeninternshipengine.me/verify/preview"
                      neogenBranding={neogenBranding}
                      partnerBranding={partnerBranding}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !selectedStudent}
            className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
            <Award size={15} />
            {submitting ? 'Issuing…' : 'Issue Certificate'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── PartnerCertSettings ───────────────────────────────────────────────────────
const PartnerCertSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesignation, setSignatoryDesignation] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [sigPreview, setSigPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const logoInputRef = useRef(null);
  const sigInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPartnerCertSettings();
        const d = res?.data ?? {};
        setSettings(d);
        setSignatoryName(d.signatoryName || '');
        setSignatoryDesignation(d.signatoryDesignation || '');
      } catch {
        toast.error('Failed to load certificate settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveText = async () => {
    setSaving(true);
    try {
      const res = await updatePartnerCertSettings({ signatoryName, signatoryDesignation });
      setSettings(res?.data ?? settings);
      toast.success('Settings saved.');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(f.type)) {
      toast.error('PNG or JPG only.'); return;
    }
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5 MB.'); return; }
    setLogoPreview(URL.createObjectURL(f));
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', f);
      const res = await uploadPartnerCertLogo(fd);
      setSettings(res?.data ?? settings);
      toast.success('Logo uploaded.');
    } catch {
      toast.error('Logo upload failed.');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSigChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(f.type)) {
      toast.error('PNG or JPG only.'); return;
    }
    if (f.size > 2 * 1024 * 1024) { toast.error('Max 2 MB.'); return; }
    setSigPreview(URL.createObjectURL(f));
    setUploadingSig(true);
    try {
      const fd = new FormData();
      fd.append('signature', f);
      const res = await uploadPartnerCertSignature(fd);
      setSettings(res?.data ?? settings);
      toast.success('Signature uploaded.');
    } catch {
      toast.error('Signature upload failed.');
      setSigPreview(null);
    } finally {
      setUploadingSig(false);
      if (sigInputRef.current) sigInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;
  }

  const currentLogoUrl = logoPreview || settings?.logoUrl || '';
  const currentSigUrl = sigPreview || settings?.signatureUrl || '';

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          These assets will appear on all certificates issued by your organization.
        </p>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Image size={16} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-800">Organization Logo</h3>
        </div>
        {currentLogoUrl ? (
          <div className="border border-gray-200 rounded-xl p-3 inline-block">
            <img src={currentLogoUrl} alt="Partner Logo" className="max-h-16 object-contain" />
          </div>
        ) : (
          <div className="w-24 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-xs text-gray-400">
            No logo
          </div>
        )}
        <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleLogoChange} className="hidden" />
        <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-60">
          <Upload size={14} />
          {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
        </button>
        <p className="text-xs text-gray-400">PNG or JPG, max 5 MB</p>
      </div>

      {/* Signatory info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <PenLine size={16} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-800">Authorized Signatory</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Signatory Name</label>
            <input type="text" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation</label>
            <input type="text" value={signatoryDesignation} onChange={(e) => setSignatoryDesignation(e.target.value)}
              placeholder="e.g. CEO"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100" />
          </div>
        </div>
        <button type="button" onClick={handleSaveText} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Signature image */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <PenLine size={16} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-800">Signatory Signature</h3>
        </div>
        {currentSigUrl ? (
          <div className="border border-gray-200 rounded-xl p-3 inline-block">
            <img src={currentSigUrl} alt="Signature" className="h-12 object-contain" />
          </div>
        ) : (
          <div className="w-32 h-12 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-xs text-gray-400">
            No signature
          </div>
        )}
        <input ref={sigInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleSigChange} className="hidden" />
        <button type="button" onClick={() => sigInputRef.current?.click()} disabled={uploadingSig}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-60">
          <Upload size={14} />
          {uploadingSig ? 'Uploading…' : 'Upload Signature'}
        </button>
        <p className="text-xs text-gray-400">PNG or JPG, max 2 MB</p>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
const CertificateWorkflow = ({ partnerOrg = '' }) => {
  const [activeTab, setActiveTab] = useState('completions');
  const [completions, setCompletions] = useState([]);
  const [myCerts, setMyCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issueModal, setIssueModal] = useState(false);
  const [prefillStudent, setPrefillStudent] = useState(null);
  const [neogenBranding, setNeogenBranding] = useState(null);
  const [partnerBranding, setPartnerBranding] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [completionsRes, certsRes] = await Promise.allSettled([
        getPartnerCompletions({ status: 'completed' }),
        getPartnerCertificates(),
      ]);
      if (completionsRes.status === 'fulfilled') {
        const d = completionsRes.value;
        setCompletions(Array.isArray(d) ? d : d?.data ?? []);
      }
      if (certsRes.status === 'fulfilled') {
        const d = certsRes.value;
        setMyCerts(Array.isArray(d) ? d : d?.data ?? []);
      }
    } catch (err) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Fetch branding for cert preview
    getPublicNeogenBranding()
      .then((res) => setNeogenBranding(res?.data ?? null))
      .catch(() => {});
    getPartnerCertSettings()
      .then((res) => setPartnerBranding(res?.data ?? null))
      .catch(() => {});
  }, []); // eslint-disable-line

  const handleIssueFromCompletion = (item) => {
    // Pre-fill the student from the completion record
    if (item.student) {
      setPrefillStudent(item.student);
    } else if (item.studentId) {
      setPrefillStudent({ _id: item.studentId, name: item.studentName || 'Student', email: '' });
    }
    setIssueModal(true);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Award size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Certificate Workflow</h1>
            <p className="text-sm text-gray-500">Issue certificates to your students</p>
          </div>
        </div>
        <button onClick={() => { setPrefillStudent(null); setIssueModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> Issue New Certificate
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'completions', label: 'Completed Internships' },
          { key: 'certificates', label: 'My Certificates' },
          { key: 'settings', label: 'Certificate Settings' },
        ].map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
            {key === 'certificates' && myCerts.length > 0 && (
              <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{myCerts.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : activeTab === 'completions' ? (
        <>
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              Students who completed your internships are listed here. Click <strong>Issue Certificate</strong> to issue them a certificate.
            </div>
          </div>
          {completions.length === 0 ? (
            <EmptyState title="No Completed Internships"
              message="Internships marked as 'Completed' in your Completion workflow will appear here." />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Student','Internship','Completed On','Action'].map(h => (
                        <th key={h} className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {completions.map((item) => {
                      const id = item._id ?? item.applicationId;
                      const studentName = item.student?.name || item.studentName || '—';
                      return (
                        <tr key={id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs shrink-0">
                                {studentName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{studentName}</p>
                                {item.student?.email && <p className="text-xs text-gray-400">{item.student.email}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.internship?.title || item.internshipTitle || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{fmt(item.completedAt ?? item.updatedAt)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleIssueFromCompletion(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors">
                              <Plus size={13} /> Issue Certificate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : activeTab === 'settings' ? (
        <PartnerCertSettings />
      ) : (
        /* My Certificates tab */
        myCerts.length === 0 ? (
          <EmptyState title="No Certificates Issued" message="Certificates you issue will appear here." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Cert ID','Student','Role','Issued','Status','Download'].map(h => (
                      <th key={h} className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myCerts.map((cert) => (
                    <tr key={cert._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">{cert.certificateId ?? '—'}</code>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{cert.student?.name ?? '—'}</p>
                        {cert.student?.email && <p className="text-xs text-gray-400">{cert.student.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cert.role || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmt(cert.issueDate ?? cert.issuedAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                          cert.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {cert.status === 'active' ? <CheckCircle2 size={11} /> : null}
                          {cert.status ? cert.status.charAt(0).toUpperCase() + cert.status.slice(1) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cert.fileUrl ? (
                          <a href={cert.fileUrl} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 transition-colors">
                            <Download size={12} /> Download
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">Generated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              {myCerts.length} certificate{myCerts.length !== 1 ? 's' : ''} issued
            </div>
          </div>
        )
      )}

      {/* Issue Certificate Modal */}
      <IssueCertificateModal
        isOpen={issueModal}
        onClose={() => { setIssueModal(false); setPrefillStudent(null); }}
        partnerOrg={partnerOrg}
        prefillStudent={prefillStudent}
        onSuccess={fetchData}
        neogenBranding={neogenBranding}
        partnerBranding={partnerBranding}
      />
    </div>
  );
};

export default CertificateWorkflow;
