import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  Send,
  Trash2,
  User,
  Mail,
  Loader2,
  Paperclip,
  Headphones,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import SupportTicketService from '../../../services/supportTicketService';
import { resolveStoryImageUrl } from '../../../utils/resolveStoryImageUrl';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'];
const STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800',
};

const formatTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

const SupportInbox = ({ mode = 'admin' }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const isAdmin = mode === 'admin';
  const replyRef = useRef(null);

  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignees, setAssignees] = useState([]);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await SupportTicketService.getTickets({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setTickets(res.tickets || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const loadTicket = async (id, { silent = false } = {}) => {
    try {
      setDetailLoading(true);
      const res = await SupportTicketService.getTicket(String(id));
      setSelected(res.ticket);
      if (socket) socket.emit('joinTicket', String(id));
      window.dispatchEvent(new CustomEvent('refreshSupportUnread'));
    } catch (err) {
      if (!silent) toast.error(err.message || 'Failed to load ticket');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    if (isAdmin) {
      SupportTicketService.getAssignees()
        .then((r) => setAssignees(r.staff || []))
        .catch(() => {});
    }
  }, [loadTickets, isAdmin]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (payload) => {
      loadTickets();
      if (
        selected?._id &&
        payload?._id &&
        String(payload._id) === String(selected._id)
      ) {
        loadTicket(selected._id, { silent: true });
      }
    };
    socket.on('ticket:updated', onUpdate);
    return () => socket.off('ticket:updated', onUpdate);
  }, [socket, selected?._id, loadTickets]);

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
      toast.success('Reply sent');
      window.dispatchEvent(new CustomEvent('refreshSupportUnread'));
    } catch (err) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status) => {
    if (!selected) return;
    try {
      const res = await SupportTicketService.updateStatus(selected._id, status);
      setSelected(res.ticket);
      loadTickets();
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAssign = async (assignedTo) => {
    if (!selected || !isAdmin) return;
    try {
      const res = await SupportTicketService.assignTicket(selected._id, assignedTo || null);
      setSelected(res.ticket);
      loadTickets();
      toast.success('Assignment updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selected || !isAdmin) return;
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await SupportTicketService.deleteTicket(selected._id);
      setSelected(null);
      loadTickets();
      toast.success('Ticket deleted');
    } catch (err) {
      toast.error(err.message);
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

  const requester = selected?.userId;

  return (
    <div className="space-y-6">
      <div className="neo-page-header">
        <h1 className="flex items-center gap-2">
          <Headphones className="text-[#FF9933]" size={28} />
          Support Inbox
        </h1>
        <p>
          {isAdmin
            ? 'Manage all support tickets, reply to users, and assign partners.'
            : 'View and reply to all support tickets for your team.'}
        </p>
      </div>

      <div className="neo-glass overflow-hidden flex flex-col lg:flex-row min-h-140 rounded-2xl border border-black/5">
        {/* Ticket list */}
        <div className="lg:w-85 border-b lg:border-b-0 lg:border-r border-black/5 flex flex-col">
          <div className="p-4 space-y-3 border-b border-black/5">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="neo-input pl-9! min-h-10! text-sm"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTickets()}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Filter size={14} className="text-gray-400 shrink-0" />
              <select
                className="neo-input min-h-9! text-sm flex-1"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin text-[#FF9933]" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 text-center">No tickets found</p>
            ) : (
              tickets.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => loadTicket(t._id)}
                  className={clsx(
                    'w-full text-left px-4 py-3 border-b border-black/5 hover:bg-[#FF9933]/5 transition-colors',
                    selected?._id === t._id && 'bg-[#FF9933]/10 border-l-4 border-l-[#FF9933]'
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono text-gray-500">{t.ticketId}</span>
                    {(isAdmin ? t.unreadByStaff : t.unreadByStaff) && (
                      <span className="h-2 w-2 rounded-full bg-[#FF9933] shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="font-semibold text-sm text-[#111827] truncate mt-1">{t.subject}</p>
                  <p className="text-xs text-gray-500 truncate">{t.userName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[t.status])}>
                      {t.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatTime(t.lastActivityAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col min-h-100">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-center">
              Select a ticket to view the conversation
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#FF9933]" />
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-black/5 flex flex-wrap gap-3 justify-between items-start">
                <div>
                  <h2 className="font-bold text-lg text-[#111827]">{selected.subject}</h2>
                  <p className="text-xs text-gray-500 font-mono">{selected.ticketId}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    className="neo-input min-h-8.5! text-xs"
                    value={selected.status}
                    onChange={(e) => handleStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {isAdmin && (
                    <>
                      <select
                        className="neo-input min-h-8.5! text-xs max-w-40"
                        value={selected.assignedTo?._id || selected.assignedTo || ''}
                        onChange={(e) => handleAssign(e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {assignees.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name} ({a.role})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                        title="Delete ticket"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isAdmin && requester && typeof requester === 'object' && (
                <div className="px-4 py-3 bg-[#f8fafc] border-b border-black/5 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <User size={14} /> {requester.name}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Mail size={14} /> {requester.email}
                  </span>
                  <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-white border">
                    {selected.role}
                  </span>
                  <span className="text-xs text-gray-500">{selected.category}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={replyRef}>
                {thread.map((msg, idx) => {
                  const isStaff = ['admin', 'partner'].includes(msg.authorRole);
                  const isMine =
                    String(msg.author) === String(user?._id) ||
                    (idx === 0 && !isStaff && String(selected.userId) === String(user?._id));
                  const alignRight = isStaff && user?.role !== 'student';
                  return (
                    <div
                      key={msg._id || idx}
                      className={clsx('flex', alignRight || isStaff ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={clsx(
                          'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                          isStaff
                            ? 'bg-[#138808]/10 border border-[#138808]/20'
                            : 'bg-white border border-black/5'
                        )}
                      >
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          {msg.authorName || selected.userName}{' '}
                          <span className="font-normal text-gray-400">· {formatTime(msg.createdAt)}</span>
                        </p>
                        <p className="text-[#111827] whitespace-pre-wrap">{msg.message}</p>
                        {msg.attachments?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((a, i) => (
                              <a
                                key={i}
                                href={resolveStoryImageUrl(a.url) || a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#FF9933] hover:underline flex items-center gap-1"
                              >
                                <Paperclip size={12} />
                                {a.fileName || 'Attachment'}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleReply} className="p-4 border-t border-black/5 flex flex-col gap-2">
                <textarea
                  className="neo-input min-h-20 resize-none"
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm text-gray-600 flex items-center gap-2 cursor-pointer">
                    <Paperclip size={16} />
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
                    Send reply
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportInbox;
