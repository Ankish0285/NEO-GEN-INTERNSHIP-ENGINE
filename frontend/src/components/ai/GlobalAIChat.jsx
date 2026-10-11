/**
 * GlobalAIChat
 * ─────────────────────────────────────────────────────────────────────────────
 * Mounted once in App.jsx — renders the NeoGen AI chatbot for ALL users:
 *
 *  • Authenticated student   → full AI Chat with subscription gating
 *  • Unauthenticated visitor → basic chat (public mode, no subscription needed)
 *  • Admin / super_admin     → nothing (they have their own tools)
 *  • Partner                 → nothing
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionProvider } from '../../context/SubscriptionContext';
import AIChatAssistant from './AIChatAssistant';
import PublicAIChat from './PublicAIChat';

const GlobalAIChat = () => {
  const { user, isAuthenticated } = useAuth();

  // Hide for admin and partner — they have their own tools
  if (isAuthenticated && user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'partner')) {
    return null;
  }

  // Authenticated student → full AI Chat with subscription
  if (isAuthenticated && user && user.role === 'student') {
    return (
      <SubscriptionProvider>
        <AIChatAssistant />
      </SubscriptionProvider>
    );
  }

  // Unauthenticated / public visitor → basic public chat
  return <PublicAIChat />;
};

export default GlobalAIChat;
