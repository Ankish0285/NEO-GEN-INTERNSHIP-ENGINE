/**
 * TurnstileWidget
 *
 * Renders a Cloudflare Turnstile human-verification widget.
 * Loads the official Cloudflare Turnstile script on first mount,
 * renders a widget, and calls onVerify(token) on success.
 *
 * Props:
 *  onVerify(token)   — called when user passes verification
 *  onExpire()        — called when token expires (user must re-verify)
 *  onError()         — called when widget errors or times out
 *  resetKey          — change this value to force a full widget reset
 *  theme             — 'light' | 'dark' | 'auto' (default: 'light')
 *
 * Uses VITE_TURNSTILE_SITE_KEY from env — never the secret key.
 */

import React, { useEffect, useRef, useId } from 'react';

const SCRIPT_ID  = 'cf-turnstile-script';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=_onTurnstileLoad';

let loadCallbacks = []; // queue of callbacks waiting for turnstile to be ready
let scriptReady   = false;

/** Load the Turnstile script once per page. */
function ensureTurnstileScript(onReady) {
  if (scriptReady && window.turnstile) {
    onReady();
    return;
  }
  loadCallbacks.push(onReady);
  if (document.getElementById(SCRIPT_ID)) return; // already loading

  window._onTurnstileLoad = () => {
    scriptReady = true;
    loadCallbacks.forEach(cb => cb());
    loadCallbacks = [];
  };

  const script = document.createElement('script');
  script.id    = SCRIPT_ID;
  script.src   = SCRIPT_URL;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    console.error('[Turnstile] Failed to load Cloudflare Turnstile script');
    loadCallbacks = [];
  };
  document.head.appendChild(script);
}

const TurnstileWidget = ({
  onVerify,
  onExpire,
  onError,
  resetKey,
  theme = 'light',
}) => {
  const containerRef = useRef(null);
  const widgetIdRef  = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

  const renderWidget = () => {
    if (!containerRef.current || !window.turnstile) return;

    // Clean up any existing widget before rendering a new one
    if (widgetIdRef.current !== null) {
      try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
      widgetIdRef.current = null;
    }

    // Clear container HTML to avoid duplicates
    containerRef.current.innerHTML = '';

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: (token) => {
        onVerify?.(token);
      },
      'expired-callback': () => {
        onExpire?.();
      },
      'error-callback': () => {
        onError?.();
      },
      'timeout-callback': () => {
        onExpire?.();
      },
    });
  };

  // Render widget when script is ready
  useEffect(() => {
    if (!siteKey || siteKey === 'your_cloudflare_turnstile_site_key_here') {
      console.warn('[Turnstile] VITE_TURNSTILE_SITE_KEY is not set — widget will not render');
      return;
    }
    ensureTurnstileScript(renderWidget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render widget when resetKey changes
  useEffect(() => {
    if (!siteKey || siteKey === 'your_cloudflare_turnstile_site_key_here') return;
    if (scriptReady && window.turnstile) {
      renderWidget();
    } else {
      ensureTurnstileScript(renderWidget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!siteKey || siteKey === 'your_cloudflare_turnstile_site_key_here') {
    // Show placeholder in dev when key isn't set
    if (import.meta.env.DEV) {
      return (
        <div style={{
          border: '1.5px dashed #e5e7eb', borderRadius: 8,
          padding: '12px 16px', fontSize: 12, color: '#9ca3af',
          background: '#f9fafb', textAlign: 'center', margin: '12px 0',
        }}>
          ⚠️ Turnstile widget placeholder — set <code>VITE_TURNSTILE_SITE_KEY</code> in <code>.env</code>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{ margin: '12px 0', minHeight: '65px', display: 'flex', justifyContent: 'center' }}
      aria-label="Human verification"
    />
  );
};

export default TurnstileWidget;
