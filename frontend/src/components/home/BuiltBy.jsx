import React from 'react';
import { motion } from 'framer-motion';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { resolveStoryImageUrl } from '../../utils/resolveStoryImageUrl';
import MotionSection from '../ui/MotionSection';

const hasText = (value) => String(value ?? '').trim().length > 0;

const BuiltBy = () => {
  const { settings } = useSiteSettings();
  const { team, branding } = settings;
  const members = (team?.members || []).filter(
    (m) =>
      hasText(m?.name) || hasText(m?.position) || hasText(m?.note) || hasText(m?.photoUrl)
  );

  if (!members.length) return null;

  return (
    <MotionSection className="neo-section" id="built-by-section">
      <div className="neo-container">
        <div className="neo-section-header">
          <h2 className="neo-h2">{team.title || 'Built By'}</h2>
          {team.subtitle && <p className="neo-lead">{team.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map((member, index) => {
            const name = String(member.name ?? '').trim() || 'Team Member';
            const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=256`;
            const photo =
              (member.photoUrl && (resolveStoryImageUrl(member.photoUrl) || member.photoUrl)) ||
              fallback;

            return (
              <motion.article
                key={index}
                className="neo-glass p-6 text-center flex flex-col items-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -6 }}
              >
                <img
                  src={photo}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover border-4 mb-4"
                  style={{ borderColor: `${branding.secondaryColor || '#16a34a'}40` }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallback;
                  }}
                />
                <h3 className="text-lg font-bold text-[#111827] mb-1">{name}</h3>
                {hasText(member.position) && (
                  <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: branding.primaryColor || '#f97316' }}
                  >
                    {String(member.position).trim()}
                  </p>
                )}
                {hasText(member.note) && (
                  <p className="neo-lead text-sm leading-relaxed">{String(member.note).trim()}</p>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
};

export default BuiltBy;
