import React from 'react';
import EmptyState from '../ui/EmptyState';

const PassportSection = ({
  title,
  icon: Icon,
  items = [],
  emptyMessage = 'Nothing here yet.',
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={18} className="text-gray-600 shrink-0" />}
        <span className="font-semibold text-gray-700">{title}</span>
      </div>

      {items.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span
              key={idx}
              className="bg-white/70 border border-gray-200 text-sm px-3 py-1.5 rounded-full"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default PassportSection;
