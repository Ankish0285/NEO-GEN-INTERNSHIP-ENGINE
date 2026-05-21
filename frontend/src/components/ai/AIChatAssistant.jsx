import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';
import { sendAIChat } from '../../services/aiService';

const AIChatAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am NeoGen AI. Ask about ATS scores, internships, or interview prep.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res = await sendAIChat(userMsg);
      setMessages((m) => [...m, { role: 'assistant', text: res?.data?.reply || res?.reply || 'No response.' }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'AI service is unavailable. Try again shortly.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        className="neo-btn neo-btn-primary fixed bottom-6 right-6 z-50 rounded-full !min-h-[56px] !w-[56px] !p-0 shadow-lg"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        aria-label="AI Assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
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
            <div className="px-4 py-3 border-b border-black/5 flex items-center gap-2 bg-gradient-to-r from-[#FF9933]/10 to-[#138808]/10">
              <Sparkles size={18} className="text-[#FF9933]" />
              <span className="font-bold text-[#111827]">NeoGen AI Coach</span>
            </div>
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
            <div className="p-3 border-t border-black/5 flex gap-2">
              <input
                className="neo-input !min-h-[40px] flex-1"
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button type="button" className="neo-btn neo-btn-success !min-h-[40px] !px-3" onClick={send}>
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatAssistant;
