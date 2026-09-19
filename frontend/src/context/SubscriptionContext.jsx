/* eslint-disable react-refresh/only-export-components */
/**
 * SubscriptionContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches /api/subscriptions/me ONCE when a student mounts the dashboard and
 * shares the result to all AI feature components.
 *
 * Exported:
 *   SubscriptionProvider  — wrap StudentDashboard with this
 *   useSubscription()     — returns { isSubscribed, freeUsed, freeLimit,
 *                                     isBlocked, subscription, plans,
 *                                     loading, refresh, openUpgrade, closeUpgrade, showUpgrade }
 */

import React, {
  createContext, useContext, useState,
  useEffect, useCallback,
} from 'react';
import { api } from '../services/api';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const [data, setData]           = useState(null);   // raw /subscriptions/me response
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showUpgrade, setUpgrade] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/subscriptions/me');
      setData(r);
    } catch {
      // Non-fatal; feature components handle 403 themselves
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch plans lazily when upgrade modal opens
  const fetchPlans = useCallback(async () => {
    if (plans.length > 0) return;
    try {
      const r = await api.get('/subscriptions/plans');
      setPlans(r.plans || []);
    } catch { /* non-fatal */ }
  }, [plans.length]);

  useEffect(() => { refresh(); }, [refresh]);

  const openUpgrade = () => { fetchPlans(); setUpgrade(true); };
  const closeUpgrade = () => setUpgrade(false);

  const freeUsed     = data?.usage?.freeUsed     ?? 0;
  const freeLimit    = data?.usage?.freeLimit     ?? 2;
  const isSubscribed = data?.isSubscribed         ?? false;
  const subscription = data?.subscription         ?? null;
  // isBlocked = free tier exhausted AND no active subscription
  const isBlocked    = !isSubscribed && freeUsed >= freeLimit;

  return (
    <SubscriptionContext.Provider value={{
      isSubscribed, freeUsed, freeLimit, isBlocked,
      subscription, plans, loading,
      refresh, openUpgrade, closeUpgrade, showUpgrade,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  // Graceful fallback so components outside the provider don't crash
  if (!ctx) {
    return {
      isSubscribed: false, freeUsed: 0, freeLimit: 2,
      isBlocked: false, subscription: null, plans: [],
      loading: false,
      refresh: async () => {},
      openUpgrade: () => {},
      closeUpgrade: () => {},
      showUpgrade: false,
    };
  }
  return ctx;
};
