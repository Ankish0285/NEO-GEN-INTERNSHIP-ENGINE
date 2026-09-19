import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Sparkles, Lock, Crown } from 'lucide-react';
import { sendAIChat } from '../../services/aiService';
import { useSubscription } from '../../context/SubscriptionContext';
import UpgradeModal from '../ui/UpgradeModal';

const AIChatAssistant = () => {
  const { isSubscribed, isBlocked, openUpgrade, closeUpgrade, showUpgrade, refresh } = useSubscription();

  const [open,     setOpen]    = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am NeoGen AI. Ask about ATS scores, internships, or interview prep.' },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;

    // If subscription is required, open upgrade modal instead of sending
    if (isBlocked) {
      openUpgrade();
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res = await sendAIChat(userMsg);
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: res?.data?.reply || res?.reply || 'No response.' },
      ]);
    } catch (err) {
      // 403 = subscription required (backend gate)
      if (err?.status === 403 || err?.response?.status === 403) {
        setMessages((m) => [
          ...m,
          { role: 'assistant', text: '🔒 Premium required. Upgrade your plan to use AI Chat.' },
        ]);
        openUpgrade();
      } else {
        setMessages((m) => [
          ...m,
          { role: 'assistant', text: 'AI service is unavailable. Try again shortly.' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Shared upgrade modal */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={closeUpgrade}
        onSubscribed={refresh}
        featureLabel="AI Chat"
      />

      {/* FAB button */}
      <motion.button
        type="button"
        className="neo-btn neo-btn-primary fixed bottom-6 right-6 z-50 rounded-full !min-h-[56px] !w-[56px] !p-0 shadow-lg"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        aria-label="AI Assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {/* Lock badge for blocked users */}
        {isBlocked && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9933] rounded-full flex items-center justify-center">
            <Lock size={9} className="text-white" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="neo-glass fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,380px)] flex flex-col overflow-hidden !rounded-2xl"
            style={{ maxHeight: '420px' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-black/5 flex items-center gap-2 bg-gradient-to-r from-[#FF9933]/10 to-[#138808]/10">
              <Sparkles size={18} className="text-[#FF9933]" />
              <span className="font-bold text-[#111827] flex-1">NeoGen AI Coach</span>
              {isSubscribed ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Crown size={9} /> Premium
                </span>
              ) : isBlocked ? (
                <span className="text-[10px] bg-[#fff0e0] text-[#e68a2e] border border-[#FFD4A0] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Lock size={9} /> Upgrade
                </span>
              ) : null}
            </div>

            {/* Upgrade prompt when blocked */}
            {isBlocked ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Lock size={32} className="text-[#FF9933]/60 mb-3" />
                <p className="text-sm font-bold text-gray-800 mb-1">AI Chat is Premium</p>
                <p className="text-xs text-gray-500 mb-4">
                  You've used all {isBlocked ? 'your free' : ''} AI analyses. Upgrade to unlock unlimited AI coaching.
                </p>
                <button
                  type="button"
                  onClick={() => { openUpgrade(); setOpen(false); }}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#FF9933,#e68a2e)' }}
                >
                  <Crown size={14} className="inline mr-1.5 mb-0.5" />
                  View Plans
                </button>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[280px]">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-sm px-3 py-2 rounded-xl max-w-[90%] ${
                        msg.role === 'user'
                          ? 'ml-auto bg-[#FF9933] text-white'
                          : 'bg-[#F9FAFB] text-[#4B5563] border border-black/5'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {loading && <p className="text-xs text-[#9CA3AF]">Thinking...</p>}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-black/5 flex gap-2">
                  <input
                    className="neo-input !min-h-[40px] flex-1"
                    placeholder="Ask anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                  />
                  <button
                    type="button"
                    className="neo-btn neo-btn-success !min-h-[40px] !px-3"
                    onClick={send}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatAssistant;
