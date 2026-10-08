import React from 'react';
import { Search } from 'lucide-react';

/**
 * ResourceFilters — fully controlled, no internal state.
 *
 * @param {{
 *   categories: string[],
 *   selectedCategory: string,
 *   onCategoryChange: function,
 *   searchValue: string,
 *   onSearchChange: function,
 *   showStatusFilter: boolean,
 *   selectedStatus: string,
 *   onStatusChange: function,
 * }} props
 */
const ResourceFilters = ({
  categories = [],
  selectedCategory = '',
  onCategoryChange,
  searchValue = '',
  onSearchChange,
  showStatusFilter = false,
  selectedStatus = '',
  onStatusChange,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Search + optional status row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search resources…"
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
        </div>

        {/* Status dropdown (admin only) */}
        {showStatusFilter && (
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        )}
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCategoryChange && onCategoryChange('')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedCategory === ''
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange && onCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceFilters;
