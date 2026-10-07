import { useState } from 'react';
import { Star } from 'lucide-react';
import { api } from '../../../services/api';
import Button from '../../ui/Button';

const RATING_FIELDS = [
  { key: 'technical', label: 'Technical Skills' },
  { key: 'communication', label: 'Communication' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'teamwork', label: 'Teamwork' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'learningAbility', label: 'Learning Ability' },
];

function StarRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-white/80 w-40 shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
            aria-label={`Rate ${label} ${star} out of 5`}
          >
            <Star
              size={22}
              className={
                star <= value
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const FeedbackForm = ({ applicationId, studentName, internshipTitle, onSubmit, onCancel }) => {
  const [ratings, setRatings] = useState({
    technical: 0,
    communication: 0,
    problemSolving: 0,
    teamwork: 0,
    professionalism: 0,
    learningAbility: 0,
  });
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allRated = Object.values(ratings).every((v) => v >= 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRated) return;
    setSubmitting(true);
    try {
      await api.post('/internship-feedback', {
        applicationId,
        ...ratings,
        strengths,
        areasForImprovement,
        comments,
      });
      onSubmit();
    } catch (err) {
      console.error('Feedback submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">Feedback for {studentName}</h3>
        <p className="text-white/60 text-sm">{internshipTitle}</p>
      </div>

      <div className="neo-glass p-4 rounded-xl space-y-1">
        <p className="text-white/70 text-xs uppercase tracking-wider mb-2">Performance Ratings</p>
        {RATING_FIELDS.map(({ key, label }) => (
          <StarRow
            key={key}
            label={label}
            value={ratings[key]}
            onChange={(val) => setRatings((prev) => ({ ...prev, [key]: val }))}
          />
        ))}
        {!allRated && (
          <p className="text-amber-400 text-xs mt-2">Please rate all 6 categories before submitting.</p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-white/70 mb-1" htmlFor="strengths">
            Strengths
          </label>
          <textarea
            id="strengths"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            placeholder="What did this intern do well?"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-1" htmlFor="areasForImprovement">
            Areas for Improvement
          </label>
          <textarea
            id="areasForImprovement"
            value={areasForImprovement}
            onChange={(e) => setAreasForImprovement(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            placeholder="What could be improved?"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-1" htmlFor="comments">
            Additional Comments
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            placeholder="Any other feedback..."
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={!allRated || submitting}
        >
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </Button>
      </div>
    </form>
  );
};

export default FeedbackForm;
