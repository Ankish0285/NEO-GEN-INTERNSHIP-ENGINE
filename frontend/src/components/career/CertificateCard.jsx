import React, { useState, useRef } from 'react';
import { Award, Copy, Download, ExternalLink, Eye, EyeOff, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import CertificatePreview from './CertificatePreview';
import { downloadCertificatePDF } from '../../utils/certExport';

const statusStyles = {
  active:  'bg-[#e8f5e6] text-[#138808]',
  pending: 'bg-[#fff4e8] text-[#e68a2e]',
  revoked: 'bg-red-100 text-red-700',
};

const StatusIcon = ({ status }) => {
  if (status === 'active')  return <CheckCircle size={12} className="inline mr-1" />;
  if (status === 'revoked') return <XCircle size={12} className="inline mr-1" />;
  return <Clock size={12} className="inline mr-1" />;
};

const CertificateCard = ({ certificate = {} }) => {
  const {
    _id,
    certificateId,
    verificationId,
    organization,
    role,
    skills = [],
    issueDate,
    issuedAt,
    status = 'pending',
    type,
    fileUrl,
    templateId,
    title,
    description,
    qrCodeData,
    student,
    issuedBy,
  } = certificate;

  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const exportRef = useRef(null);

  const handleCopy = () => {
    if (certificateId) {
      navigator.clipboard.writeText(certificateId).then(() => toast.success('Copied!'));
    }
  };

  const handleDownload = async () => {
    // For uploaded certs, open the file URL directly
    if (fileUrl) {
      window.open(fileUrl, '_blank');
      return;
    }
    // For generated certs, export via html2canvas + jsPDF
    if (!exportRef.current) {
      toast.error('Preview not available yet. Click View first.');
      return;
    }
    setDownloading(true);
    try {
      const filename = `${certificateId || 'certificate'}.pdf`;
      await downloadCertificatePDF(exportRef, filename);
      toast.success('Certificate downloaded!');
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleVerify = () => {
    if (verificationId) {
      window.open(`/verify/${verificationId}`, '_blank');
    } else if (certificateId) {
      window.open(`/certificate/verify/${certificateId}`, '_blank');
    }
  };

  const displayDate = issueDate || issuedAt;
  const formattedDate = displayDate
    ? new Date(displayDate).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null;

  const studentName = typeof student === 'object' ? student?.name : '';

  const onExportReady = (ref) => {
    exportRef.current = ref.current;
  };

  return (
    <div className="neo-glass rounded-xl border border-[#FFD9A0] overflow-hidden">
      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Award size={26} className="text-[#FF9933] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 leading-tight">{organization || 'Organization'}</p>
            {role && <p className="text-sm text-gray-500">{role}</p>}
            {title && title !== 'Internship Completion Certificate' && (
              <p className="text-xs text-gray-400 mt-0.5 italic">{title}</p>
            )}
          </div>
        </div>

        {/* Date + status */}
        <div className="flex items-center gap-2 flex-wrap">
          {formattedDate && (
            <span className="text-xs text-gray-500">Issued {formattedDate}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyles[status] || statusStyles.pending}`}>
            <StatusIcon status={status} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {type && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {type === 'uploaded' ? '📎 Uploaded' : '✨ Generated'}
            </span>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 5).map((skill, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-md">
                +{skills.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Certificate ID */}
        {certificateId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono truncate flex-1">{certificateId}</span>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Copy certificate ID"
            >
              <Copy size={13} />
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {/* View / collapse (only for generated certs) */}
          {type === 'generated' && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              {expanded ? <EyeOff size={12} /> : <Eye size={12} />}
              {expanded ? 'Hide' : 'View'}
            </button>
          )}
          {/* View uploaded file */}
          {type === 'uploaded' && fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <Eye size={12} />
              View
            </a>
          )}
          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#fff4e8] hover:bg-[#FFD9A0] text-[#e68a2e] transition-colors disabled:opacity-60"
          >
            <Download size={12} />
            {downloading ? 'Downloading…' : 'Download'}
          </button>
          {/* Verify */}
          {(verificationId || certificateId) && (
            <button
              type="button"
              onClick={handleVerify}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#e8f5e6] hover:bg-green-100 text-[#138808] transition-colors"
            >
              <ExternalLink size={12} />
              Verify
            </button>
          )}
        </div>
      </div>

      {/* Certificate preview (expanded) */}
      {expanded && type === 'generated' && (
        <div className="border-t border-[#FFD9A0] bg-gray-50 p-4 overflow-x-auto">
          <CertificatePreview
            templateId={templateId || 'classic'}
            studentName={studentName}
            certificateId={certificateId}
            role={role}
            organization={organization}
            duration={certificate.duration}
            skills={skills}
            issueDate={displayDate}
            issuerName={typeof issuedBy === 'object' ? issuedBy?.name : ''}
            title={title}
            description={description}
            qrCodeData={qrCodeData || (verificationId ? `/verify/${verificationId}` : '')}
            onExportReady={onExportReady}
          />
        </div>
      )}
    </div>
  );
};

export default CertificateCard;
