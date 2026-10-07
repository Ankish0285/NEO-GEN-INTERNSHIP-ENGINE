import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Award, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { verifyCertificate } from '../services/careerService';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Returns "FirstName L." — first name + last initial only.
 * NEVER exposes email, phone, or full last name.
 */
const formatStudentName = (fullName) => {
  if (!fullName) return 'Student';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? '';
  return `${firstName} ${lastInitial}.`;
};

const StatusDisplay = ({ status }) => {
  if (status === 'active') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="flex flex-col items-center gap-2"
      >
        <CheckCircle2 size={64} className="text-emerald-400" />
        <span className="text-emerald-400 font-bold text-xl tracking-wide">✓ VERIFIED</span>
      </motion.div>
    );
  }
  if (status === 'pending') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-2"
      >
        <Clock size={64} className="text-amber-400" />
        <span className="text-amber-400 font-bold text-xl tracking-wide">⏳ Pending Verification</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-2"
    >
      <XCircle size={64} className="text-red-400" />
      <span className="text-red-400 font-bold text-xl tracking-wide">✗ REVOKED</span>
    </motion.div>
  );
};

const CertificateVerification = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    if (!certificateId) return;
    const fetchCertificate = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setCertificate(null);
      try {
        const data = await verifyCertificate(certificateId);
        const cert = data?.data ?? data ?? null;
        if (!cert) {
          setNotFound(true);
        } else {
          setCertificate(cert);
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError('Unable to verify certificate. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [certificateId]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (trimmed) {
      navigate(`/certificate/verify/${trimmed}`);
    }
  };

  return (
    <div className="min-h-screen bg-theme-grid flex flex-col items-center justify-center p-6">
      {/* Branding */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Award size={28} className="text-amber-400" />
          <span className="text-3xl font-extrabold text-amber-400 tracking-tight">NEO GEN</span>
        </div>
        <p className="text-white/60 text-sm">Internship Engine</p>
        <p className="text-white/40 text-xs mt-1">Certificate Verification Portal</p>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="neo-glass max-w-lg w-full p-8 rounded-2xl"
      >
        {loading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
            <p className="text-white/60 text-sm">Verifying certificate…</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-6 space-y-3">
            <XCircle size={48} className="text-red-400 mx-auto" />
            <p className="text-red-400 font-semibold">{error}</p>
            <p className="text-white/50 text-sm">
              Certificate ID: <code className="font-mono">{certificateId}</code>
            </p>
          </div>
        )}

        {!loading && notFound && (
          <div className="text-center py-6 space-y-3">
            <Search size={48} className="text-white/30 mx-auto" />
            <p className="text-white font-semibold text-lg">Certificate Not Found</p>
            <p className="text-white/50 text-sm">
              No certificate found with ID:{' '}
              <code className="font-mono text-white/70">{certificateId}</code>
            </p>
            <p className="text-white/40 text-xs">
              Double-check the ID or use the search below.
            </p>
          </div>
        )}

        {!loading && !error && !notFound && certificate && (
          <div className="space-y-6">
            {/* Status visual */}
            <div className="flex flex-col items-center py-2">
              <StatusDisplay status={certificate.status} />
            </div>

            {/* Certificate details */}
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Student</p>
                  <p className="text-white font-semibold">
                    {formatStudentName(certificate.studentName)}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Organization</p>
                  <p className="text-white font-semibold">{certificate.organization ?? '—'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Role</p>
                  <p className="text-white/80">{certificate.role ?? '—'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Issued On</p>
                  <p className="text-white/80">{formatDate(certificate.issuedAt)}</p>
                </div>
              </div>

              {/* Skills */}
              {Array.isArray(certificate.skills) && certificate.skills.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {certificate.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification timestamp */}
              <div className="bg-white/5 rounded-lg px-4 py-3">
                <p className="text-white/40 text-xs">
                  Verified at:{' '}
                  <span className="text-white/60 font-mono">
                    {new Date().toLocaleString('en-IN')}
                  </span>
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  Certificate ID:{' '}
                  <code className="font-mono text-white/60">
                    {certificate.certificateId ?? certificateId}
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Verify Another section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-6 neo-glass max-w-lg w-full p-5 rounded-2xl"
      >
        <p className="text-white/60 text-sm text-center mb-3">Verify another certificate</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Certificate ID…"
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors flex items-center gap-1.5"
          >
            <Search size={15} />
            Search
          </button>
        </form>
      </motion.div>

      <p className="text-white/20 text-xs mt-6">
        © {new Date().getFullYear()} NEO GEN Internship Engine
      </p>
    </div>
  );
};

export default CertificateVerification;
