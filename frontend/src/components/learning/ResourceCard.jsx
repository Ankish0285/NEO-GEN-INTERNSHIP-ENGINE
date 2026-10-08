import React from 'react';
import { BookOpen, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORY_COLORS = {
  'Interview Prep':     'bg-blue-100 text-blue-700',
  'Resume & CV':        'bg-violet-100 text-violet-700',
  'Career Development': 'bg-emerald-100 text-emerald-700',
  'Industry Insights':  'bg-amber-100 text-amber-700',
  'Soft Skills':        'bg-pink-100 text-pink-700',
  'Technical Skills':   'bg-cyan-100 text-cyan-700',
  'Other':              'bg-gray-100 text-gray-600',
};

const DIFFICULTY_COLORS = {
  Beginner:     'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced:     'bg-red-100 text-red-700',
};

const AUDIENCE_LABELS = {
  students: 'Students',
  partners: 'Partners',
  both:     'Students & Partners',
  public:   'Public',
};

/**
 * ResourceCard
 *
 * @param {{ resource: object, onClick: function, showAudience: boolean }} props
 */
const ResourceCard = ({ resource, onClick, showAudience = false }) => {
  const shortDesc =
    resource.description && resource.description.length > 120
      ? `${resource.description.slice(0, 120)}…`
      : resource.description || '';

  const categoryClass =
    CATEGORY_COLORS[resource.category] || CATEGORY_COLORS['Other'];
  const difficultyClass =
    DIFFICULTY_COLORS[resource.difficulty] || DIFFICULTY_COLORS['Beginner'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="neo-glass overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 rounded-xl flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Fallback placeholder (always in DOM, hidden when thumbnail loaded) */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100"
          style={{ display: resource.thumbnailUrl ? 'none' : 'flex' }}
        >
          <BookOpen className="w-12 h-12 text-indigo-300" />
        </div>
        {/* Play overlay */}
        {resource.youtubeVideoId && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-indigo-600 ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${categoryClass}`}>
            {resource.category || 'Other'}
          </span>
          {resource.difficulty && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${difficultyClass}`}>
              {resource.difficulty}
            </span>
          )}
          {showAudience && resource.targetAudience && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {AUDIENCE_LABELS[resource.targetAudience] || resource.targetAudience}
            </span>
          )}
        </div>

        <h3 className="font-bold text-[#111827] text-base leading-snug mb-2 line-clamp-2">
          {resource.title}
        </h3>
        <p className="text-sm text-[#4B5563] flex-1 mb-3">{shortDesc}</p>

        {resource.estimatedTime && (
          <p className="text-xs text-slate-400 mt-auto">{resource.estimatedTime}</p>
        )}
      </div>
    </motion.div>
  );
};

export default ResourceCard;
