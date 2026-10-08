import React, { useState, useEffect } from 'react';
import { Book, Code, FileText, Briefcase, Mic, RefreshCw, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getActionPlan, updateActionItem } from '../../../services/careerService';
import { Skeleton } from '../../ui/Skeleton';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';

const iconMap = {
  learning: Book,
  coding: Code,
  resume: FileText,
  apply: Briefcase,
  interview: Mic,
};

const priorityStyles = {
  high: { bg: 'bg-[#fff4e8]', text: 'text-[#e68a2e]' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  low: { bg: 'bg-green-100', text: 'text-green-700' },
};

const CareerActionPlan = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const data = await getActionPlan();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('[CareerActionPlan] fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkDone = async (itemId) => {
    try {
      await updateActionItem(itemId);
      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId || item.id === itemId ? { ...item, done: true } : item
        )
      );
      toast.success('Action marked done!');
    } catch (err) {
      console.error('[CareerActionPlan] mark done error:', err?.message);
      toast.error('Failed to update action item.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="neo-h2 flex items-center gap-2">
          <CheckCircle className="text-[#FF9933]" />
          Career Action Plan
        </h1>
        <Button variant="secondary" onClick={fetchPlan}>
          <RefreshCw size={16} className="inline mr-1" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No Action Items Yet"
          message="Complete your profile to generate a personalized career action plan."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => {
            const Icon = iconMap[item.type] || Book;
            const priority = (item.priority || 'medium').toLowerCase();
            const pStyle = priorityStyles[priority] || priorityStyles.medium;

            return (
              <motion.div
                key={item._id || item.id || idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`neo-glass p-5 flex items-start gap-4 ${item.done ? 'opacity-60' : ''}`}
              >
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#FF9933]/10 text-[#FF9933] font-black text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className="text-[#FF9933] flex-shrink-0" />
                    <h3 className={`font-bold text-[#111827] ${item.done ? 'line-through' : ''}`}>
                      {item.title}
                    </h3>
                    <span
                      className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${pStyle.bg} ${pStyle.text}`}
                    >
                      {priority}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  )}
                  {item.estimatedImpact && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Impact: {item.estimatedImpact}
                    </p>
                  )}
                </div>
                {!item.done && (
                  <Button
                    variant="success"
                    onClick={() => handleMarkDone(item._id || item.id)}
                    className="flex-shrink-0"
                  >
                    <CheckCircle size={14} className="inline mr-1" />
                    Mark Done
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CareerActionPlan;
