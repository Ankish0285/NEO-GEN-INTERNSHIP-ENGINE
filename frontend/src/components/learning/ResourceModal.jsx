import React from 'react';
import Modal from '../ui/Modal';
import ResourcePlayer from './ResourcePlayer';

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

/**
 * ResourceModal
 *
 * Renders a full-detail view of a learning resource inside a Modal.
 * If the resource has a youtubeVideoId it shows the embedded player;
 * otherwise the player shows its friendly "no video" fallback.
 *
 * @param {{ resource: object|null, isOpen: boolean, onClose: function }} props
 */
const ResourceModal = ({ resource, isOpen, onClose }) => {
  if (!resource) return null;

  const categoryClass =
    CATEGORY_COLORS[resource.category] || CATEGORY_COLORS['Other'];
  const difficultyClass =
    DIFFICULTY_COLORS[resource.difficulty] || DIFFICULTY_COLORS['Beginner'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resource.title || 'Learning Resource'}
      className="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Video player (or fallback) */}
        <ResourcePlayer
          videoId={resource.youtubeVideoId || ''}
          title={resource.title}
        />

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-900">{resource.title}</h2>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {resource.category && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${categoryClass}`}>
              {resource.category}
            </span>
          )}
          {resource.difficulty && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${difficultyClass}`}>
              {resource.difficulty}
            </span>
          )}
          {resource.estimatedTime && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              ⏱ {resource.estimatedTime}
            </span>
          )}
        </div>

        {/* Description */}
        {resource.description && (
          <p className="text-sm text-slate-600 leading-relaxed">
            {resource.description}
          </p>
        )}

        {/* Tags */}
        {Array.isArray(resource.tags) && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ResourceModal;
