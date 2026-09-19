/**
 * GlobalAIChat
 * ─────────────────────────────────────────────────────────────────────────────
 * Mounted once in App.jsx — renders the NeoGen AI Coach chatbot for
 * authenticated students only.
 *
 * Rules:
 *  • Unauthenticated visitors  → nothing rendered
 *  • Admin / super_admin        → nothing (they have their own support tools)
 *  • Partner                   → nothing
 *  • Student                   → AIChatAssistant with SubscriptionProvider
 *
 * SubscriptionProvider must wrap AIChatAssistant because that component calls
 * useSubscription().  The StudentDashboard already wraps its own tree with
 * SubscriptionProvider; when the student navigates OUTSIDE the dashboard
 * (e.g. /find-internship, /success-stories) the provider needs to be here too.
 * We use a lazy inner provider that only mounts when needed.
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionProvider } from '../../context/SubscriptionContext';
import AIChatAssistant from './AIChatAssistant';

const GlobalAIChat = () => {
  const { user, isAuthenticated } = useAuth();

  // Only render for authenticated students
  if (!isAuthenticated || !user) return null;
  if (user.role !== 'student') return null;

  return (
    // SubscriptionProvider here ensures the chat works even on non-dashboard pages.
    // When the student IS on the dashboard, SubscriptionProvider is already in the
    // tree from StudentDashboard.jsx — React context nesting is safe; the inner
    // provider will simply re-fetch and the closest provider wins.
    <SubscriptionProvider>
      <AIChatAssistant />
    </SubscriptionProvider>
  );
};

export default GlobalAIChat;
