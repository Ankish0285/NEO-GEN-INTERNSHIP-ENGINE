import React from 'react';
import { VideoOff } from 'lucide-react';

/**
 * ResourcePlayer
 *
 * Renders a responsive 16:9 YouTube embed iframe.
 * Uses a sandbox to restrict the embedded content to minimum required permissions.
 * Shows a friendly error card when videoId is falsy or invalid.
 *
 * @param {{ videoId: string, title: string }} props
 */
const ResourcePlayer = ({ videoId, title }) => {
  if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 bg-slate-50 rounded-xl border border-slate-200">
        <VideoOff className="w-10 h-10 text-slate-400" />
        <p className="text-sm text-slate-500 font-medium text-center">
          No video is available for this resource.
        </p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId.trim()}?rel=0&modestbranding=1`;

  return (
    <div className="w-full">
      {/* 16:9 aspect-ratio wrapper */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={embedUrl}
          title={title || 'Learning Resource Video'}
          className="absolute top-0 left-0 w-full h-full rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allowFullScreen
        />
      </div>
      {title && (
        <p className="mt-3 text-sm font-semibold text-slate-700 text-center">
          {title}
        </p>
      )}
    </div>
  );
};

export default ResourcePlayer;
