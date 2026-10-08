import React, { useState, useEffect } from 'react';
import { TrendingUp, ClipboardList } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../../services/api';
import { Skeleton } from '../../ui/Skeleton';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';

const defaultForm = {
  outcomeType: 'Accepted',
  rejectionReason: '',
  notes: '',
};

const ApplicationOutcomes = () => {
  const [activeTab, setActiveTab] = useState('record');
  const [form, setForm] = useState({ ...defaultForm });
  const [submitting, setSubmitting] = useState(false);
  const [patterns, setPatterns] = useState(null);
  const [interviewLearning, setInterviewLearning] = useState(null);
  const [patternsLoading, setPatternsLoading] = useState(false);

  // Track if patterns have been fetched
  const [patternsFetched, setPatternsFetched] = useState(false);

  const fetchPatterns = async () => {
    if (patternsFetched) return;
    setPatternsLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        api.get('/outcomes/patterns'),
        api.get('/outcomes/interview-learning'),
      ]);
      setPatterns(pRes?.data ?? pRes ?? null);
      setInterviewLearning(iRes?.data ?? iRes ?? null);
      setPatternsFetched(true);
    } catch (err) {
      console.warn('[ApplicationOutcomes] patterns fetch error:', err?.message);
    } finally {
      setPatternsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'patterns') {
      fetchPatterns();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/outcomes', form);
      toast.success('Outcome recorded successfully!');
      setForm({ ...defaultForm });
    } catch (err) {
      console.error('[ApplicationOutcomes] submit error:', err?.message);
      toast.error('Failed to record outcome. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="neo-h2 flex items-center gap-2">
        <TrendingUp className="text-[#FF9933]" />
        Application Outcomes
      </h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('record')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
            activeTab === 'record'
              ? 'border-[#FF9933] text-[#FF9933] bg-[#FF9933]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList size={14} />
          Record Outcome
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('patterns')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
            activeTab === 'patterns'
              ? 'border-[#FF9933] text-[#FF9933] bg-[#FF9933]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp size={14} />
          Pattern Analysis
        </button>
      </div>

      {/* Record tab */}
      {activeTab === 'record' && (
        <div className="neo-glass p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcome Type</label>
              <select
                name="outcomeType"
                value={form.outcomeType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40"
              >
                <option value="Rejected">Rejected</option>
                <option value="Accepted">Accepted</option>
                <option value="Waitlisted">Waitlisted</option>
                <option value="No Response">No Response</option>
              </select>
            </div>

            {form.outcomeType === 'Rejected' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason
                </label>
                <textarea
                  name="rejectionReason"
                  value={form.rejectionReason}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40 resize-none"
                  placeholder="Describe the reason for rejection (if known)..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40 resize-none"
                placeholder="Any additional notes about this application..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Record Outcome'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Pattern analysis tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-6">
          {patternsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : !patterns && !interviewLearning ? (
            <EmptyState
              title="No Patterns Yet"
              message="Apply to internships to see your outcome patterns"
            />
          ) : (
            <>
              {/* Rejection patterns */}
              {patterns?.rejectionPatterns && (
                <div className="neo-glass p-5">
                  <h3 className="font-bold text-[#111827] mb-4">Rejection Patterns</h3>
                  <div className="space-y-3">
                    {Object.entries(patterns.rejectionPatterns).map(([key, val]) => {
                      const pct = Math.max(0, Math.min(100, Number(val) || 0));
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{key}</span>
                            <span className="font-semibold text-gray-900">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-red-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggested actions */}
              {Array.isArray(patterns?.suggestedActions) &&
                patterns.suggestedActions.length > 0 && (
                  <div className="neo-glass p-5">
                    <h3 className="font-bold text-[#111827] mb-3">Suggested Actions</h3>
                    <ul className="space-y-2">
                      {patterns.suggestedActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-4 h-4 mt-0.5 rounded border border-gray-300" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Interview weak topics */}
              {Array.isArray(interviewLearning?.weakTopics) &&
                interviewLearning.weakTopics.length > 0 && (
                  <div className="neo-glass p-5">
                    <h3 className="font-bold text-[#111827] mb-3">Interview Weak Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {interviewLearning.weakTopics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-[#fff4e8] text-[#e68a2e] text-xs font-semibold rounded-full border border-[#FF9933]/20"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Learning recommendations */}
              {Array.isArray(interviewLearning?.recommendations) &&
                interviewLearning.recommendations.length > 0 && (
                  <div className="neo-glass p-5">
                    <h3 className="font-bold text-[#111827] mb-3">Learning Recommendations</h3>
                    <ul className="space-y-2">
                      {interviewLearning.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-[#FF9933] font-bold mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationOutcomes;
