import { useState, useEffect } from 'react';
import { Award, CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPartnerCompletions, issueCertificate } from '../../../services/careerService';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

const CertificateWorkflow = () => {
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState({});

  useEffect(() => {
    const fetchCompleted = async () => {
      setLoading(true);
      try {
        const data = await getPartnerCompletions({ status: 'completed' });
        setCompletions(Array.isArray(data) ? data : data?.data ?? []);
      } catch (err) {
        console.error('Failed to fetch completed internships:', err);
        toast.error('Failed to load completed internships.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompleted();
  }, []);

  const handleIssueCertificate = async (item) => {
    const id = item._id ?? item.applicationId;
    setIssuing(prev => ({ ...prev, [id]: 'loading' }));
    try {
      await issueCertificate({
        applicationId: item.applicationId ?? item._id,
        studentId: item.studentId,
        internshipId: item.internshipId,
        role: item.internshipTitle,
        organization: item.organizationName,
        duration: item.duration,
      });
      setIssuing(prev => ({ ...prev, [id]: 'issued' }));
      toast.success(`Certificate issued for ${item.studentName || 'student'}!`);
    } catch (err) {
      console.error('Certificate issuance failed:', err);
      setIssuing(prev => ({ ...prev, [id]: null }));
      toast.error(err?.message || 'Failed to issue certificate.');
    }
  };

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Award size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Certificate Workflow</h1>
          <p className="text-sm text-gray-500">Issue certificates to students who completed internships</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <strong>Two-step process:</strong> You issue the certificate here. A Super Admin must then verify it before it becomes active and visible to the student.
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : completions.length === 0 ? (
        <EmptyState
          title="No Completed Internships"
          message="Internships marked as 'Completed' in your Completion workflow will appear here for certificate issuance."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Student</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Internship</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Completed On</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Certificate</th>
                  <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wide px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {completions.map((item) => {
                  const id = item._id ?? item.applicationId;
                  const issuedStatus = issuing[id];
                  const alreadyIssued = issuedStatus === 'issued' || item.certificateIssued;
                  const isLoading = issuedStatus === 'loading';

                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs shrink-0">
                            {(item.studentName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{item.studentName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.internshipTitle || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmt(item.completedAt ?? item.updatedAt)}</td>
                      <td className="px-4 py-3">
                        {alreadyIssued ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#138808] bg-[#e8f5e6] border border-[#138808]/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={12} />
                            Issued — Pending Admin Verification
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#e68a2e] bg-[#fff4e8] border border-[#FFD9A0] px-2.5 py-1 rounded-full">
                            <Clock size={12} />
                            Not Issued
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!alreadyIssued && (
                          <button
                            onClick={() => handleIssueCertificate(item)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9933] hover:bg-[#e68a2e] disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            <Plus size={13} />
                            {isLoading ? 'Issuing…' : 'Issue Certificate'}
                          </button>
                        )}
                        {alreadyIssued && (
                          <span className="text-xs text-gray-400">Awaiting verification</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            {completions.length} completed internship{completions.length !== 1 ? 's' : ''} eligible for certificates
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateWorkflow;
