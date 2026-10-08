import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Play, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPublicResources } from '../../services/learningService';
import MotionReveal from '../ui/MotionReveal';

// YouTube thumbnail helper
const getThumb = (resource) => {
  if (resource.thumbnailUrl) return resource.thumbnailUrl;
  if (resource.youtubeVideoId)
    return `https://img.youtube.com/vi/${resource.youtubeVideoId}/mqdefault.jpg`;
  return null;
};

const CATEGORY_COLOR = {
  'Interview Prep':     'bg-[#fff4e8] text-[#e68a2e]',
  'Resume & CV':        'bg-[#e8f5e6] text-[#138808]',
  'Career Development': 'bg-[#e8f5e6] text-[#138808]',
  'Industry Insights':  'bg-[#fff4e8] text-[#e68a2e]',
  'Soft Skills':        'bg-[#e8f5e6] text-[#138808]',
  'Technical Skills':   'bg-[#fff4e8] text-[#e68a2e]',
  'Other':              'bg-gray-100 text-gray-600',
};

const ResourceCard = ({ resource, onClick }) => {
  const thumb = getThumb(resource);
  const catClass = CATEGORY_COLOR[resource.category] || CATEGORY_COLOR['Other'];

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className="neo-glass rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#fff4e8] to-[#e8f5e6]">
            <BookOpen size={40} className="text-[#FF9933] opacity-60" />
          </div>
        )}
        {/* Play overlay for video resources */}
        {resource.youtubeVideoId && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-12 h-12 rounded-full bg-[#FF9933] flex items-center justify-center shadow-lg">
              <Play size={20} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${catClass}`}>
            {resource.category || 'General'}
          </span>
          {resource.difficulty && (
            <span className="text-[11px] text-gray-400">{resource.difficulty}</span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{resource.description}</p>
        )}
      </div>
    </motion.div>
  );
};

// Modal for playing video
const VideoModal = ({ resource, onClose }) => {
  if (!resource) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{resource.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg font-bold px-2">✕</button>
        </div>
        {resource.youtubeVideoId ? (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${resource.youtubeVideoId}?rel=0&autoplay=1`}
              title={resource.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 text-sm">
            No video available for this resource.
          </div>
        )}
        {resource.description && (
          <p className="px-5 py-3 text-xs text-gray-500 border-t border-gray-100">{resource.description}</p>
        )}
      </div>
    </div>
  );
};

const LearningSection = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getPublicResources({ limit: 6 })
      .then((res) => {
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        setResources(list.slice(0, 6));
      })
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, []);

  // Don't render section if still loading
  if (loading) {
    return (
      <section className="neo-section" id="learning-section">
        <div className="neo-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-64" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="neo-section" id="learning-section">
      <div className="neo-container">
        <MotionReveal>
          {/* Header */}
          <div className="neo-section-header">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fff4e8] border border-[#FF9933]/20 mb-4">
              <GraduationCap size={16} className="text-[#FF9933]" />
              <span className="text-sm font-semibold text-[#e68a2e]">Learning Resources</span>
            </div>
            <h2 className="neo-h2">
              Learn &amp; <span className="neo-brand-saffron">Grow</span>
            </h2>
            <p className="neo-lead mt-3">
              Free career resources, interview guides, and skill-building videos to help you land your dream internship.
            </p>
          </div>
        </MotionReveal>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-64" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          // Empty state — no public resources yet
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '🎯', title: 'Interview Prep', desc: 'Ace your interviews with expert tips and mock questions' },
              { icon: '📄', title: 'Resume Building', desc: 'Craft a standout resume that gets noticed by top companies' },
              { icon: '🚀', title: 'Career Growth', desc: 'Learn skills that make you the ideal internship candidate' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="neo-glass rounded-2xl p-6 flex flex-col items-center text-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#fff4e8] flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
                <span className="text-xs text-[#e68a2e] font-medium mt-1">Coming Soon</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {resources.map((r) => (
              <motion.div
                key={r._id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <ResourceCard resource={r} onClick={() => setSelected(r)} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View all button */}
        {!loading && resources.length > 0 && (
          <MotionReveal>
            <div className="text-center mt-10">
              <button
                onClick={() => navigate('/learning-resources')}
                className="neo-btn neo-btn-primary inline-flex items-center gap-2"
              >
                View All Resources
                <ArrowRight size={18} />
              </button>
            </div>
          </MotionReveal>
        )}
      </div>

      {/* Video modal */}
      {selected && <VideoModal resource={selected} onClose={() => setSelected(null)} />}
    </section>
  );
};

export default LearningSection;
