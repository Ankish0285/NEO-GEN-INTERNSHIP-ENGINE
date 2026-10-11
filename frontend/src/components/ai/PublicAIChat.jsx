/**
 * PublicAIChat
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight AI chatbot for public (unauthenticated) visitors.
 * Uses the same /api/ai/chat endpoint but without subscription gating.
 * Prompts visitors to sign up for full AI features.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Sparkles, User, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: "👋 Hi! I'm NeoGen AI. I can help you with internship tips, resume advice, and career guidance. Ask me anything!",
  },
];

const MAX_PUBLIC_MESSAGES = 5; // Limit public chat to 5 exchanges

const PublicAIChat = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = async () => {
    if (!input.trim() || loading) return;

    // Limit reached → prompt to sign up
    if (msgCount >= MAX_PUBLIC_MESSAGES) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: "You've reached the free chat limit. Sign up for free to get unlimited AI career guidance! 🚀",
          isLimit: true,
        },
      ]);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    setMsgCount((c) => c + 1);

    try {
      const res = await api.post('/ai/public-chat', {
        message: userMsg,
      });
      const reply = res?.data?.reply || res?.reply || 'I can help with internship and career questions!';
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'AI is temporarily unavailable. Please try again shortly.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '520px', background: '#fff', border: '1px solid rgba(17,24,39,0.08)' }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#FF9933,#e68a2e)' }}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">NeoGen AI</p>
                <p className="text-[11px] opacity-80">Career & Internship Guide</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: '#f9fafb' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[#FF9933] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={13} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#FF9933] text-white rounded-br-sm'
                        : msg.isLimit
                        ? 'bg-[#fff4e8] text-[#e68a2e] border border-[#FFD9A0] rounded-bl-sm'
                        : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                    {msg.isLimit && (
                      <button
                        onClick={() => navigate('/login')}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#FF9933] hover:bg-[#e68a2e] text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <LogIn size={12} /> Sign Up Free
                      </button>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={13} className="text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-[#FF9933] flex items-center justify-center flex-shrink-0">
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                    <div className="flex gap-1 items-center h-5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[#FF9933]"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Free limit indicator */}
            {msgCount > 0 && msgCount < MAX_PUBLIC_MESSAGES && (
              <div className="px-4 py-1.5 bg-white border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {MAX_PUBLIC_MESSAGES - msgCount} free message{MAX_PUBLIC_MESSAGES - msgCount !== 1 ? 's' : ''} left
                </span>
                <button
                  onClick={() => navigate('/login')}
                  className="text-[11px] text-[#FF9933] font-semibold hover:underline"
                >
                  Sign up for unlimited →
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading || msgCount >= MAX_PUBLIC_MESSAGES}
                placeholder={msgCount >= MAX_PUBLIC_MESSAGES ? 'Sign up to continue...' : 'Ask about internships...'}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]/20 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                type="button"
                onClick={send}
                disabled={!input.trim() || loading || msgCount >= MAX_PUBLIC_MESSAGES}
                className="w-9 h-9 rounded-xl bg-[#FF9933] hover:bg-[#e68a2e] disabled:opacity-40 flex items-center justify-center flex-shrink-0 transition-colors"
                aria-label="Send"
              >
                <Send size={15} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#FF9933,#e68a2e)', boxShadow: '0 4px 20px rgba(255,153,51,0.4)' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
};

export default PublicAIChat;
