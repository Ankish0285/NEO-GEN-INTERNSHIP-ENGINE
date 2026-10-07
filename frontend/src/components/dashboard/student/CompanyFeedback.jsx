import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { api } from '../../../services/api';
import ConfidenceBar from '../../career/ConfidenceBar';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

const CompanyFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const data = await api.get('/internship-feedback/my');
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setFeedback(list);
      } catch (err) {
        console.warn('[CompanyFeedback] fetch error:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <h1 className="neo-h2 flex items-center gap-2">
        <Star className="text-[#FF9933]" />
        Company Feedback
      </h1>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : feedback.length === 0 ? (
        <EmptyState
          title="No Feedback Yet"
          message="Complete an internship to receive company feedback"
        />
      ) : (
        <div className="space-y-5">
          {feedback.map((item, idx) => {
            const overall = Math.round(
              ((item.technical ?? 0) +
                (item.communication ?? 0) +
                (item.problemSolving ?? 0) +
                (item.teamwork ?? 0) +
                (item.professionalism ?? 0) +
                (item.learningAbility ?? 0)) /
                6
            );
            const date = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : null;

            return (
              <div key={item._id || idx} className="neo-glass p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-[#111827] text-base">
                      {item.organizationName || item.organization || 'Company'}
                    </h3>
                    {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-[#FF9933] leading-none">
                      {overall}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">/ 5 avg</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <ConfidenceBar
                    label="Technical"
                    score={(item.technical ?? 0) * 20}
                    showPercent
                    size="sm"
                  />
                  <ConfidenceBar
                    label="Communication"
                    score={(item.communication ?? 0) * 20}
                    showPercent
                    size="sm"
                  />
                  <ConfidenceBar
                    label="Problem Solving"
                    score={(item.problemSolving ?? 0) * 20}
                    showPercent
                    size="sm"
                  />
                  <ConfidenceBar
                    label="Teamwork"
                    score={(item.teamwork ?? 0) * 20}
                    showPercent
                    size="sm"
                  />
                  <ConfidenceBar
                    label="Professionalism"
                    score={(item.professionalism ?? 0) * 20}
                    showPercent
                    size="sm"
                  />
                  <ConfidenceBar
                    label="Learning Ability"
                    score={(item.learningAbility ?? 0) * 20}
                    showPercent
                    size="sm"
                  />
                </div>

                {item.comments && (
                  <p className="mt-4 text-sm text-gray-600 italic border-t border-gray-100 pt-3">
                    "{item.comments}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyFeedback;
