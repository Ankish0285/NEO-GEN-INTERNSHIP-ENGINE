import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
  Search,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  BarChart2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getEmailLogs,
  getEmailStats,
  retryEmailLog,
  sendAnnouncement,
  getEmailSettings,
  updateEmailSettings,
} from '../../../services/emailService';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  sent:    'bg-green-100 text-green-700 border border-green-200',
  failed:  'bg-red-100 text-red-700 border border-red-200',
  pending: 'bg-[#fff4e8] text-[#e68a2e] border border-amber-200',
};
const STATUS_ICON = {
  sent:    <CheckCircle size={12} />,
  failed:  <XCircle size={12} />,
  pending: <Clock size={12} />,
};

const EVENT_LABELS = {
  welcome:              'Welcome',
  new_internship:       'New Internship',
  success_story:        'Success Story',
  certificate_issued:   'Certificate Issued',
  certificate_status:   'Certificate Status',
  announcement:         'Announcement',
};

const CATEGORY_LABELS = {
  welcomeEmail:        'Welcome Email',
  newInternship:       'New Internship',
  successStory:        'Success Story',
  certificateIssued:   'Certificate Issued',
  certificateStatus:   'Certificate Status',
  announcements:       'Announcements',
};

const CATEGORY_DESCS = {
  welcomeEmail:        'Sent to new users when they register',
  newInternship:       'Sent to all students when a new internship is published',
  successStory:        'Sent to all students when a success story is published',
  certificateIssued:   'Sent to the student when their certificate is issued',
  certificateStatus:   'Sent to the student when certificate status changes',
  announcements:       'Important platform announcements sent by admin',
};

const SAFFRON = '#FF9933';
const GREEN   = '#138808';
const NAVY    = '#000080';

// ─── Stats Cards ────────────────────────────────────────────────────────────────
const StatsCards = ({ stats, loading }) => {
  const cards = [
    { label: 'Total Sent',   value: stats?.byStatus?.sent    ?? 0, color: GREEN,   icon: <CheckCircle size={22} /> },
    { label: 'Failed',       value: stats?.byStatus?.failed  ?? 0, color: '#dc2626', icon: <XCircle size={22} /> },
    { label: 'Pending',      value: stats?.byStatus?.pending ?? 0, color: SAFFRON, icon: <Clock size={22} /> },
    { label: 'Total Emails', value: stats?.total             ?? 0, color: NAVY,    icon: <Mail size={22} /> },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
          {loading ? (
            <Skeleton className="h-8 w-16 rounded" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span style={{ color: c.color }}>{c.icon}</span>
                <span className="text-2xl font-bold" style={{ color: NAVY }}>{c.value.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Category Toggles ───────────────────────────────────────────────────────────
const CategoryToggles = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    getEmailSettings()
      .then((res) => setSettings(res?.emailNotifications ?? {}))
      .catch(() => toast.error('Failed to load email settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (key) => {
    const current = settings[key]?.enabled !== false;
    const updated = { ...settings, [key]: { enabled: !current } };
    setSettings(updated);
    setSaving(key);
    try {
      await updateEmailSettings({ emailNotifications: updated });
      toast.success(`${CATEGORY_LABELS[key]} ${!current ? 'enabled' : 'disabled'}`);
    } catch {
      setSettings((prev) => ({ ...prev, [key]: { enabled: current } }));
      toast.error('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <ToggleRight size={18} style={{ color: SAFFRON }} />
        <h3 className="font-semibold text-sm" style={{ color: NAVY }}>Notification Categories</h3>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {Object.keys(CATEGORY_LABELS).map((key) => {
            const enabled = settings[key]?.enabled !== false;
            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{CATEGORY_LABELS[key]}</p>
                  <p className="text-xs text-gray-500">{CATEGORY_DESCS[key]}</p>
                </div>
                <button
                  onClick={() => handleToggle(key)}
                  disabled={saving === key}
                  className="shrink-0 ml-4 transition-opacity"
                  style={{ opacity: saving === key ? 0.5 : 1 }}
                  aria-label={`Toggle ${CATEGORY_LABELS[key]}`}
                >
                  {enabled ? (
                    <ToggleRight size={28} style={{ color: GREEN }} />
                  ) : (
                    <ToggleLeft size={28} className="text-gray-400" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Announcement Form ───────────────────────────────────────────────────────────
const EMPTY_ANN = { audience: 'students', subject: '', title: '', body: '', cta: '', ctaUrl: '' };

const AnnouncementForm = () => {
  const [form, setForm] = useState(EMPTY_ANN);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.title.trim() || !form.body.trim()) {
      toast.error('Subject, title and body are required');
      return;
    }
    if (!window.confirm(`Send this announcement to "${form.audience}" audience?`)) return;
    setSending(true);
    try {
      const res = await sendAnnouncement(form);
      toast.success(`Announcement queued for ${res?.recipientCount ?? 0} recipient(s)`);
      setForm(EMPTY_ANN);
    } catch (err) {
      toast.error(err?.message || 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone size={18} style={{ color: SAFFRON }} />
        <h3 className="font-semibold text-sm" style={{ color: NAVY }}>Send Announcement</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Audience</label>
          <select
            name="audience"
            value={form.audience}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <option value="students">Students</option>
            <option value="partners">Partners</option>
            <option value="all">Everyone</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email Subject *</label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="e.g. Important Platform Update"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Announcement Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. New Features Available"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Message Body *</label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            rows={4}
            placeholder="Write your announcement here..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CTA Button Text</label>
            <input
              name="cta"
              value={form.cta}
              onChange={handleChange}
              placeholder="e.g. Learn More"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CTA URL</label>
            <input
              name="ctaUrl"
              value={form.ctaUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: SAFFRON }}
        >
          <Send size={15} />
          {sending ? 'Sending…' : 'Send Announcement'}
        </button>
      </form>
    </div>
  );
};

// ─── Email Log Table ─────────────────────────────────────────────────────────────
const EmailLogTable = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    eventType: '',
    search: '',
    from: '',
    to: '',
  });

  const fetchLogs = useCallback(async (p = 1, f = filters) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (f.status)    params.status    = f.status;
      if (f.eventType) params.eventType = f.eventType;
      if (f.search)    params.search    = f.search;
      if (f.from)      params.from      = f.from;
      if (f.to)        params.to        = f.to;
      const res = await getEmailLogs(params);
      setLogs(res?.data ?? []);
      setTotal(res?.total ?? 0);
      setPage(res?.page ?? 1);
      setPages(res?.pages ?? 1);
    } catch {
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(1, filters); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (e) => {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1, filters);
  };

  const handleRetry = async (id) => {
    setRetrying(id);
    try {
      await retryEmailLog(id);
      toast.success('Email retry succeeded');
      fetchLogs(page, filters);
    } catch (err) {
      toast.error(err?.message || 'Retry failed');
    } finally {
      setRetrying(null);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={18} style={{ color: NAVY }} />
        <h3 className="font-semibold text-sm" style={{ color: NAVY }}>Email Log</h3>
        <span className="ml-auto text-xs text-gray-400">{total.toLocaleString()} entries</span>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search email…"
            className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs w-44 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        <select
          name="eventType"
          value={filters.eventType}
          onChange={handleFilterChange}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="">All Types</option>
          {Object.entries(EVENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input
          type="date"
          name="from"
          value={filters.from}
          onChange={handleFilterChange}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        <input
          type="date"
          name="to"
          value={filters.to}
          onChange={handleFilterChange}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ backgroundColor: NAVY }}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => { setFilters({ status: '', eventType: '', search: '', from: '', to: '' }); fetchLogs(1, { status: '', eventType: '', search: '', from: '', to: '' }); }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
        >
          Reset
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Mail size={28} className="text-gray-300" />}
          title="No email logs found"
          description="Email logs will appear here after notifications are sent."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-400 font-medium">
                  <th className="pb-2 pr-3">Recipient</th>
                  <th className="pb-2 pr-3">Type</th>
                  <th className="pb-2 pr-3">Subject</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-3 max-w-[160px] truncate font-medium text-gray-700">
                      {log.recipientEmail}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {EVENT_LABELS[log.eventType] ?? log.eventType}
                      </span>
                    </td>
                    <td className="py-2 pr-3 max-w-[200px] truncate text-gray-600">{log.subject}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[log.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_ICON[log.status]}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-gray-400">{fmt(log.createdAt)}</td>
                    <td className="py-2">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(log._id)}
                          disabled={retrying === log._id}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-white transition-opacity disabled:opacity-50"
                          style={{ backgroundColor: SAFFRON }}
                        >
                          <RefreshCw size={11} className={retrying === log._id ? 'animate-spin' : ''} />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">
                Page {page} of {pages} ({total.toLocaleString()} total)
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => fetchLogs(page - 1, filters)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => fetchLogs(page + 1, filters)}
                  disabled={page >= pages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────────
const EmailNotifications = () => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getEmailStats()
      .then((res) => setStats(res))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setStatsLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: NAVY }}>
          <Mail size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: NAVY }}>Email Notifications</h1>
          <p className="text-xs text-gray-500">Manage automated emails, announcements, and notification history</p>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Settings + Announcement side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryToggles />
        <AnnouncementForm />
      </div>

      {/* Email Log */}
      <EmailLogTable />
    </div>
  );
};

export default EmailNotifications;
