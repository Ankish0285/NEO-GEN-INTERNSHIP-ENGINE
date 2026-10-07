import { useState, useEffect } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPartnerCompletions, issueCertificate } from '../../../services/careerService';
import { api } from '../../../services/api';
import Button from '../../ui/Button';
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
    setIssuing((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      await issueCertificate({
        applicationId: item.applicationId ?? item._id,
        studentId: item.studentId,
        internshipId: item.internshipId,
      });
      setIssuing((prev) => ({ ...prev, [id]: 'issued' }));
      toast.success(`Certificate issued for ${item.studentName}!`);
    } catch (err) {
      console.error('Certificate issuance failed:', err);
      setIssuing((prev) => ({ ...prev, [id]: null }));
      toast.error('Failed to issue certificate.');
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

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="neo-glass p-4 rounded-xl flex items-start gap-3">
        <Award size={18} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-white/70 text-sm">
          Admin must verify before a certificate becomes active and visible to students.
        </p>
      </div>

      {completions.length === 0 ? (
        <EmptyState
          title="No Completed Internships"
          message="Completed internships will appear here for certificate issuance."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl neo-glass">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/60 font-medium px-4 py-3">Student</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Internship</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Completed On</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Status</th>
                <th className="text-left text-white/60 font-medium px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {completions.map((item) => {
                const id = item._id ?? item.applicationId;
                const issuedStatus = issuing[id];
                const alreadyIssued = issuedStatus === 'issued' || item.certificateIssued;

                return (
                  <tr key={id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{item.studentName}</td>
                    <td className="px-4 py-3 text-white/80">{item.internshipTitle}</td>
                    <td className="px-4 py-3 text-white/60">{formatDate(item.completedAt ?? item.updatedAt)}</td>
                    <td className="px-4 py-3">
                      {alreadyIssued ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 size={14} />
                          Issued
                        </span>
                      ) : (
                        <span className="text-amber-400 text-xs font-medium">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!alreadyIssued && (
                        <Button
                          variant="primary"
                          disabled={issuedStatus === 'loading'}
                          onClick={() => handleIssueCertificate(item)}
                        >
                          <Award size={14} className="mr-1.5" />
                          {issuedStatus === 'loading' ? 'Issuing…' : 'Issue Certificate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CertificateWorkflow;
