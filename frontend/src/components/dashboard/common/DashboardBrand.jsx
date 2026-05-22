import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { resolveStoryImageUrl } from '../../../utils/resolveStoryImageUrl';
import defaultLogo from '../../../assets/images/logo.png';

/**
 * Unified NeoGen logo + wordmark for all dashboard sidebars and top bars.
 * Uses site branding (CMS logo, colors, name lines) with local asset fallback.
 */
const DashboardBrand = ({
  variant = 'sidebar',
  showSubtitle = true,
  linkToHome = true,
  className = '',
}) => {
  const { settings } = useSiteSettings();
  const { branding } = settings;

  const logoSrc = branding.logoUrl
    ? resolveStoryImageUrl(branding.logoUrl) || branding.logoUrl
    : defaultLogo;

  const isCompact = variant === 'compact';
  const logoSize = isCompact ? 36 : 44;

  const inner = (
    <div
      className={clsx(
        'neo-dash-brand flex items-center gap-3 min-w-0',
        isCompact && 'neo-dash-brand--compact',
        className
      )}
    >
      <img
        src={logoSrc}
        alt={`${branding.brandNameLine1 || 'NEO'} ${branding.brandNameLine2 || 'GEN'} logo`}
        className="neo-dash-brand__logo shrink-0"
        style={{ width: logoSize, height: logoSize }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = defaultLogo;
        }}
      />
      <div className="min-w-0 flex flex-col">
        <p
          className={clsx(
            'font-extrabold tracking-tight text-[#111827] leading-tight m-0',
            isCompact ? 'text-base' : 'text-xl'
          )}
        >
          <span style={{ color: branding.primaryColor || '#FF9933' }}>
            {branding.brandNameLine1 || 'NEO'}
          </span>{' '}
          <span style={{ color: branding.secondaryColor || '#138808' }}>
            {branding.brandNameLine2 || 'GEN'}
          </span>
        </p>
        {showSubtitle && branding.brandSubtitle && (
          <p className="neo-dash-brand__subtitle m-0 mt-0.5 truncate">
            {branding.brandSubtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="neo-dash-brand-link no-underline hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  }

  return inner;
};

export default DashboardBrand;
