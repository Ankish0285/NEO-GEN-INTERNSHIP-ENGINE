import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  MessageCircle,
  Send,
  Plus,
  Loader2,
  Paperclip,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import SupportTicketService from '../../../services/supportTicketService';
import { resolveStoryImageUrl } from '../../../utils/resolveStoryImageUrl';

const CATEGORIES = ['Technical', 'Account', 'Application', 'Internship', 'Billing', 'General', 'Other'];
const STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800',
};

const formatTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleString();
};

const StudentSupport = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [view, setView] = useState('list');
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    message: '',
    category: 'General',
    file: null,
  });
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState(null);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await SupportTicketService.getTickets();
      setTickets(res.tickets || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (payload) => {
      loadTickets();
      if (
        selected?._id &&
        payload?._id &&
        String(payload._id) === String(selected._id)
      ) {
        refreshTicket(selected._id, { silent: true });
      }
    };
    socket.on('ticket:updated', onUpdate);
    return () => socket.off('ticket:updated', onUpdate);
  }, [socket, selected?._id, loadTickets]);

  const refreshTicket = async (id, { silent = false, fallback = null } = {}) => {
    const ticketId = String(id);
    try {
      const res = await SupportTicketService.getTicket(ticketId);
      setSelected(res.ticket);
      setView('thread');
      if (socket) socket.emit('joinTicket', ticketId);
      window.dispatchEvent(new CustomEvent('refreshSupportUnread'));
      return res.ticket;
    } catch (err) {
      if (fallback) {
        setSelected(fallback);
        setView('thread');
      }
      if (!silent) toast.error(err.message);
      return null;
    }
  };

  const openTicket = (id, listItem = null) => refreshTicket(id, { fallback: listItem });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('subject', form.subject.trim());
      fd.append('message', form.message.trim());
      fd.append('category', form.category);
      if (form.file) fd.append('file', form.file);
      const res = await SupportTicketService.createTicket(fd);
      toast.success('Support ticket created');
      setForm({ subject: '', message: '', category: 'General', file: null });
      await loadTickets();
      refreshTicket(res.ticket._id, { fallback: res.ticket });
      window.dispatchEvent(new CustomEvent('refreshSupportUnread'));
    } catch (err) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('message', replyText.trim());
      if (replyFile) fd.append('file', replyFile);
      const res = await SupportTicketService.reply(selected._id, fd);
      setSelected(res.ticket);
      setReplyText('');
      setReplyFile(null);
      loadTickets();
      toast.success('Message sent');
      window.dispatchEvent(new CustomEvent('refreshSupportUnread'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const thread = selected
    ? [
        {
          _id: 'initial',
          authorName: selected.userName,
          authorRole: selected.role,
          message: selected.message,
          attachments: selected.attachments || [],
          createdAt: selected.createdAt,
        },
        ...(selected.replies || []),
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="neo-page-header flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2">
            <MessageCircle className="text-[#138808]" size={28} />
            Contact Support
          </h1>
          <p>Get help from our team — all messages stay inside your dashboard.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={clsx('neo-btn', view === 'list' ? 'neo-btn-primary' : 'neo-btn-ghost')}
            onClick={() => {
              setView('list');
              setSelected(null);
            }}
          >
            My tickets
          </button>
          <button
            type="button"
            className={clsx('neo-btn', view === 'new' ? 'neo-btn-success' : 'neo-btn-ghost')}
            onClick={() => setView('new')}
          >
            <Plus size={16} /> New request
          </button>
        </div>
      </div>

      {view === 'new' && (
        <div className="neo-glass p-6 md:p-8 max-w-2xl">
          <h2 className="text-lg font-bold text-[#111827] mb-4">Send a support request</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="admin-label">Subject</label>
              <input
                className="neo-input"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Brief summary of your issue"
                required
              />
            </div>
            <div>
              <label className="admin-label">Category</label>
              <select
                className="neo-input"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">Message</label>
              <textarea
                className="neo-input min-h-[120px]"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Describe your issue in detail..."
                required
                rows={5}
              />
            </div>
            <div>
              <label className="admin-label flex items-center gap-2">
                <Paperclip size={16} /> Screenshot / file (optional)
              </label>
              <input
                type="file"
                className="neo-input !py-2"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
              />
            </div>
            <button type="submit" disabled={sending} className="neo-btn neo-btn-primary">
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Send to support
            </button>
          </form>
        </div>
      )}

      {view === 'list' && (
        <div className="neo-glass overflow-hidden rounded-2xl">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-[#FF9933]" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No support tickets yet.</p>
              <button type="button" className="neo-btn neo-btn-primary mt-4" onClick={() => setView('new')}>
                Create your first request
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-black/5">
              {tickets.map((t) => (
                <li key={t._id}>
                  <button
                    type="button"
                    onClick={() => openTicket(t._id, t)}
                    className="w-full text-left px-6 py-4 hover:bg-[#138808]/5 transition-colors flex justify-between items-center gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#111827] truncate">{t.subject}</p>
                      <p className="text-xs text-gray-500 font-mono">{t.ticketId}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.unreadByUser && (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF9933]" title="New reply" />
                      )}
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          STATUS_COLORS[t.status]
                        )}
                      >
                        {t.status}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {view === 'thread' && selected && (
        <div className="neo-glass flex flex-col min-h-[480px] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-black/5 flex justify-between items-center">
            <div>
              <button
                type="button"
                className="text-sm text-[#FF9933] hover:underline mb-1"
                onClick={() => {
                  setView('list');
                  setSelected(null);
                  loadTickets();
                }}
              >
                ← Back to tickets
              </button>
              <h2 className="font-bold text-lg">{selected.subject}</h2>
              <p className="text-xs text-gray-500 font-mono">{selected.ticketId}</p>
            </div>
            <span className={clsx('text-xs px-3 py-1 rounded-full font-medium', STATUS_COLORS[selected.status])}>
              {selected.status}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {thread.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">No messages yet.</p>
            )}
            {thread.map((msg, idx) => {
              const isStaff = msg._id !== 'initial' && ['admin', 'partner'].includes(msg.authorRole);
              return (
                <div key={msg._id || idx} className={clsx('flex', isStaff ? 'justify-start' : 'justify-end')}>
                  <div
                    className={clsx(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                      isStaff
                        ? 'bg-[#FF9933]/10 border border-[#FF9933]/20'
                        : 'bg-[#138808]/10 border border-[#138808]/20'
                    )}
                  >
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      {isStaff ? 'Support Team' : user?.name || 'You'} · {formatTime(msg.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    {msg.attachments?.length > 0 && (
                      <div className="mt-2">
                        {msg.attachments.map((a, i) => (
                          <a
                            key={i}
                            href={resolveStoryImageUrl(a.url) || a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#FF9933] block"
                          >
                            {a.fileName || 'View attachment'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleReply} className="p-4 border-t border-black/5 space-y-2">
              <textarea
                className="neo-input min-h-[72px]"
                placeholder="Continue the conversation..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <label className="text-sm text-gray-600 cursor-pointer flex items-center gap-1">
                  <Paperclip size={14} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
                  />
                  {replyFile ? replyFile.name : 'Attach file'}
                </label>
                <button type="submit" disabled={sending || !replyText.trim()} className="neo-btn neo-btn-primary">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send
                </button>
              </div>
            {selected.status === 'Resolved' && (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 size={14} /> Resolved — send a message to reopen this ticket.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default StudentSupport;
