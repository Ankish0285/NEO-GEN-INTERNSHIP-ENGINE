import React from 'react';
import { Award, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const statusStyles = {
  active: 'bg-[#e8f5e6] text-[#138808]',
  pending: 'bg-[#fff4e8] text-[#e68a2e]',
  revoked: 'bg-red-100 text-red-700',
};

const CertificateCard = ({ certificate = {} }) => {
  const {
    certificateId,
    organization,
    role,
    skills = [],
    issuedAt,
    status = 'pending',
    qrCodeData,
  } = certificate;

  const handleCopy = () => {
    if (certificateId) {
      navigator.clipboard.writeText(certificateId).then(() => {
        toast.success('Copied!');
      });
    }
  };

  const formattedDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="neo-glass p-6 rounded-xl border border-[#FFD9A0] space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Award size={28} className="text-[#FF9933] shrink-0" />
        <div>
          <p className="font-semibold text-gray-800">{organization || 'Organization'}</p>
          {role && <p className="text-sm text-gray-500">{role}</p>}
        </div>
      </div>

      {/* Date + status */}
      <div className="flex items-center gap-2 flex-wrap">
        {formattedDate && (
          <span className="text-xs text-gray-500">Issued {formattedDate}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyles[status] || statusStyles.pending}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">
              {skill}
            </span>
          ))}
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
            <Copy size={14} />
          </button>
        </div>
      )}

      {/* QR / Verification data */}
      {status === 'active' && qrCodeData && (
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">Verification Data</p>
          <p className="text-xs text-gray-700 font-mono break-all">{qrCodeData}</p>
        </div>
      )}
    </div>
  );
};

export default CertificateCard;
