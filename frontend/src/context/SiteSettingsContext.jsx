/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SiteSettingsService from '../services/siteSettingsService';
import { mergeSiteSettings, defaultSiteSettings } from '../utils/defaultSiteSettings';

const SiteSettingsContext = createContext(null);

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const remote = await SiteSettingsService.getPublic();
      setSettings(mergeSiteSettings(remote));
    } catch (err) {
      console.error('[SiteSettings] load failed:', err);
      setSettings(defaultSiteSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const applySettings = (remote) => {
    const merged = mergeSiteSettings(remote);
    setSettings(merged);
    return merged;
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh, applySettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    return { settings: defaultSiteSettings, loading: false, refresh: async () => {}, applySettings: (s) => mergeSiteSettings(s) };
  }
  return ctx;
};
