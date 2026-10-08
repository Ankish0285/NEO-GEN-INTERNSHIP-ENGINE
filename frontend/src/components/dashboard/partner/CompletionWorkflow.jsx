import { useState, useEffect } from 'react';
import { CheckCircle2, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPartnerCompletions, updateCompletionStatus } from '../../../services/careerService';
import { api } from '../../../services/api';
import FeedbackForm from './FeedbackForm';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

const STATUS_BADGE = {
  Selected: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  Started: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  'In Progress': 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
  Completed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
};

const STATUS_PROGRESSION = ['Selected', 'Started', 'In Progress', 'Completed'];

const CompletionWorkflow = () => {
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, applicationId: null, newStatus: '' });
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    applicationId: null,
    studentName: '',
    internshipTitle: '',
  });

  const fetchCompletions = async () => {
    setLoading(true);
    try {
      const data = await getPartnerCompletions();
      setCompletions(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch completions:', err);
      toast.error('Failed to load completions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletions();
  }, []);

  const handleStatusUpdate = async () => {
    const { applicationId, newStatus } = confirmModal;
    setConfirmModal({ open: false, applicationId: null, newStatus: '' });
    try {
      await updateCompletionStatus(applicationId, newStatus);
      toast.success(`Status updated to "${newStatus}".`);
      fetchCompletions();
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update status.');
    }
  };

  const handleFeedbackSubmit = () => {
    setFeedbackModal({ open: false, applicationId: null, studentName: '', internshipTitle: '' });
    toast.success('Feedback submitted!');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  if (!completions.length) {
    return (
      <EmptyState
        title="No Internships Found"
        message="Active and completed internships will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {completions.map((item) => {
        const currentIdx = STATUS_PROGRESSION.indexOf(item.status);
        const nextStatus = currentIdx < STATUS_PROGRESSION.length - 1
          ? STATUS_PROGRESSION[currentIdx + 1]
          : null;

        return (
          <div key={item._id ?? item.applicationId} className="neo-glass p-5 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{item.studentName}</p>
                <p className="text-white/60 text-sm truncate">{item.internshipTitle}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[item.status] ?? 'bg-white/10 text-white/70'}`}>
                  {item.status}
                </span>

                {nextStatus && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setConfirmModal({ open: true, applicationId: item._id ?? item.applicationId, newStatus: nextStatus })
                    }
                  >
                    Update to {nextStatus}
                  </Button>
                )}

                {item.status === 'Completed' && (
                  <>
                    <a href="/partner/dashboard/certificates">
                      <Button variant="success">
                        <Award size={15} className="mr-1.5" />
                        Issue Certificate
                      </Button>
                    </a>
                    <Button
                      variant="primary"
                      onClick={() =>
                        setFeedbackModal({
                          open: true,
                          applicationId: item._id ?? item.applicationId,
                          studentName: item.studentName,
                          internshipTitle: item.internshipTitle,
                        })
                      }
                    >
                      <CheckCircle2 size={15} className="mr-1.5" />
                      Mark Completed
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Confirm status update modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, applicationId: null, newStatus: '' })}
        title="Confirm Status Update"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            Update this internship status to{' '}
            <span className="font-semibold text-white">"{confirmModal.newStatus}"</span>?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ open: false, applicationId: null, newStatus: '' })}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleStatusUpdate}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Feedback modal */}
      <Modal
        isOpen={feedbackModal.open}
        onClose={() => setFeedbackModal({ open: false, applicationId: null, studentName: '', internshipTitle: '' })}
        title="Submit Intern Feedback"
      >
        <FeedbackForm
          applicationId={feedbackModal.applicationId}
          studentName={feedbackModal.studentName}
          internshipTitle={feedbackModal.internshipTitle}
          onSubmit={handleFeedbackSubmit}
          onCancel={() => setFeedbackModal({ open: false, applicationId: null, studentName: '', internshipTitle: '' })}
        />
      </Modal>
    </div>
  );
};

export default CompletionWorkflow;
