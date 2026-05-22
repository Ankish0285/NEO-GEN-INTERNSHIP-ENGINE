const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { createAndNotify } = require('../utils/notificationHelper');

const STAFF_ROLES = ['admin', 'partner'];

/** Normalize ObjectId or populated { _id } for comparisons */
function idStr(value) {
  if (value == null) return '';
  if (typeof value === 'object') {
    if (value._id != null) return String(value._id);
    if (value.id != null) return String(value.id);
  }
  return String(value);
}

function idsMatch(a, b) {
  const sa = idStr(a);
  const sb = idStr(b);
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  try {
    return new mongoose.Types.ObjectId(sa).equals(sb);
  } catch {
    return false;
  }
}

function userRole(user) {
  return (user?.role || 'student').toLowerCase();
}

function isTicketOwner(user, ticket) {
  if (!user || !ticket) return false;
  if (idsMatch(ticket.userId, user._id)) return true;
  const te = (ticket.email || '').toLowerCase().trim();
  const ue = (user.email || '').toLowerCase().trim();
  return te && ue && te === ue;
}

async function generateTicketId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await SupportTicket.countDocuments({
    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  });
  return `TKT-${date}-${String(count + 1).padStart(4, '0')}`;
}

function emitTicketUpdate(req, ticket, recipientIds = []) {
  const io = req.app.get('io');
  if (!io || !ticket) return;
  const payload = { ticketId: ticket.ticketId, _id: ticket._id, status: ticket.status };
  io.to(`ticket:${ticket._id}`).emit('ticket:updated', payload);
  const ids = new Set(recipientIds.filter(Boolean).map(String));
  ids.add(idStr(ticket.userId));
  if (ticket.assignedTo) ids.add(idStr(ticket.assignedTo));
  ids.forEach((id) => io.to(`user:${id}`).emit('ticket:updated', payload));
}

async function notifyAdminsNewTicket(req, ticket) {
  const admins = await User.find({ role: 'admin', active: { $ne: false } }).select('_id');
  await Promise.all(
    admins.map((a) =>
      createAndNotify(req.app, {
        recipient: a._id,
        title: 'New support ticket',
        message: `${ticket.userName}: ${ticket.subject}`,
        type: 'urgent',
        priority: ticket.priority === 'high' ? 'high' : 'medium',
        link: '/admin/dashboard/support-inbox',
      })
    )
  );
}

function canAccessTicket(user, ticket) {
  if (!user || !ticket) return false;
  const role = userRole(user);
  if (role === 'admin') return true;
  if (isTicketOwner(user, ticket)) return true;
  if (role === 'partner' && idsMatch(ticket.assignedTo, user._id)) return true;
  return false;
}

async function loadTicketFull(id) {
  return SupportTicket.findById(id)
    .populate('assignedTo', 'name email role')
    .populate('userId', 'name email role profilePicture phone college');
}

function parseAttachments(body) {
  if (!body.attachments) return [];
  try {
    const parsed = typeof body.attachments === 'string' ? JSON.parse(body.attachments) : body.attachments;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// @desc    Create support ticket
// @route   POST /api/support-tickets
const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, category, priority } = req.body;
  if (!subject?.trim() || !message?.trim()) {
    res.status(400);
    throw new Error('Subject and message are required');
  }

  const ticketId = await generateTicketId();
  const attachments = parseAttachments(req.body);
  if (req.file) {
    attachments.push({
      url: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
    });
  }

  const ticket = await SupportTicket.create({
    ticketId,
    userId: req.user._id,
    userName: req.user.name || req.user.fullName || 'User',
    email: req.user.email,
    role: req.user.role,
    subject: subject.trim(),
    message: message.trim(),
    category: category || 'General',
    priority: priority || 'medium',
    attachments,
    unreadByStaff: true,
    unreadByUser: false,
    lastActivityAt: new Date(),
  });

  await notifyAdminsNewTicket(req, ticket);
  emitTicketUpdate(req, ticket);

  res.status(201).json({ success: true, ticket });
});

// @desc    List tickets (role-filtered)
// @route   GET /api/support-tickets
const getTickets = asyncHandler(async (req, res) => {
  const { status, category, search, assignedTo } = req.query;
  const filter = {};

  const role = userRole(req.user);
  const and = [];

  if (role === 'student') {
    const ownerOr = [{ userId: req.user._id }];
    if (req.user.email) {
      ownerOr.push({
        email: new RegExp(`^${req.user.email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      });
    }
    and.push({ $or: ownerOr });
  } else if (role === 'partner') {
    filter.assignedTo = req.user._id;
  } else if (role === 'admin' && assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (status) filter.status = status;
  if (category) filter.category = category;

  if (search?.trim()) {
    const q = search.trim();
    and.push({
      $or: [
        { subject: { $regex: q, $options: 'i' } },
        { ticketId: { $regex: q, $options: 'i' } },
        { userName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    });
  }

  if (and.length) filter.$and = and;

  const tickets = await SupportTicket.find(filter)
    .sort({ lastActivityAt: -1 })
    .populate('assignedTo', 'name email role')
    .populate('userId', 'name email role profilePicture');

  res.json({ success: true, count: tickets.length, tickets });
});

// @desc    Unread count for badge
// @route   GET /api/support-tickets/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  let count = 0;
  if (req.user.role === 'admin') {
    count = await SupportTicket.countDocuments({ unreadByStaff: true });
  } else if (req.user.role === 'partner') {
    count = await SupportTicket.countDocuments({ assignedTo: req.user._id, unreadByStaff: true });
  } else {
    count = await SupportTicket.countDocuments({ userId: req.user._id, unreadByUser: true });
  }
  res.json({ success: true, count });
});

// @desc    Get single ticket
// @route   GET /api/support-tickets/:id
const getTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let ticket = await SupportTicket.findById(id);

  if (!ticket && id.startsWith('TKT-')) {
    ticket = await SupportTicket.findOne({ ticketId: id });
  }

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (!canAccessTicket(req.user, ticket)) {
    res.status(403);
    throw new Error('Not authorized to view this ticket');
  }

  const role = userRole(req.user);
  if (role === 'admin' || (role === 'partner' && idsMatch(ticket.assignedTo, req.user._id))) {
    if (ticket.unreadByStaff) {
      ticket.unreadByStaff = false;
      await ticket.save();
    }
  } else if (isTicketOwner(req.user, ticket) && ticket.unreadByUser) {
    ticket.unreadByUser = false;
    await ticket.save();
  }

  const full = await loadTicketFull(ticket._id);
  res.json({ success: true, ticket: full });
});

// @desc    Reply to ticket
// @route   POST /api/support-tickets/:id/reply
const replyTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400);
    throw new Error('Reply message is required');
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (!canAccessTicket(req.user, ticket)) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const attachments = parseAttachments(req.body);
  if (req.file) {
    attachments.push({ url: `/uploads/${req.file.filename}`, fileName: req.file.originalname });
  }

  ticket.replies.push({
    author: req.user._id,
    authorName: req.user.name || req.user.fullName || 'Staff',
    authorRole: req.user.role,
    message: message.trim(),
    attachments,
  });

  const isStaff = STAFF_ROLES.includes(req.user.role);
  if (isStaff) {
    ticket.unreadByUser = true;
    ticket.unreadByStaff = false;
    if (ticket.status === 'Pending') ticket.status = 'In Progress';
  } else {
    ticket.unreadByStaff = true;
    ticket.unreadByUser = false;
    if (ticket.status === 'Resolved') ticket.status = 'In Progress';
  }

  ticket.lastActivityAt = new Date();
  await ticket.save();

  const link =
    req.user.role === 'admin'
      ? '/admin/dashboard/support-inbox'
      : req.user.role === 'partner'
        ? '/partner/dashboard/support-inbox'
        : '/dashboard/support';

  const notifyRecipient = isStaff ? ticket.userId : null;
  if (notifyRecipient) {
    await createAndNotify(req.app, {
      recipient: notifyRecipient,
      title: 'Support reply received',
      message: `Update on ticket ${ticket.ticketId}`,
      type: 'personal',
      priority: 'medium',
      link: '/dashboard/support',
    });
  } else {
    const admins = await User.find({ role: 'admin', active: { $ne: false } }).select('_id');
    await Promise.all(
      admins.map((a) =>
        createAndNotify(req.app, {
          recipient: a._id,
          title: 'User replied to ticket',
          message: `${ticket.ticketId}: ${ticket.subject}`,
          type: 'new',
          link: '/admin/dashboard/support-inbox',
        })
      )
    );
    if (ticket.assignedTo) {
      await createAndNotify(req.app, {
        recipient: ticket.assignedTo,
        title: 'User replied to your assigned ticket',
        message: ticket.subject,
        type: 'personal',
        link: '/partner/dashboard/support-inbox',
      });
    }
  }

  emitTicketUpdate(req, ticket);
  const full = await loadTicketFull(ticket._id);
  res.json({ success: true, ticket: full });
});

// @desc    Update ticket status
// @route   PATCH /api/support-tickets/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const role = userRole(req.user);
  if (role === 'partner') {
    if (!idsMatch(ticket.assignedTo, req.user._id)) {
      res.status(403);
      throw new Error('Not authorized');
    }
  } else if (role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }

  ticket.status = status;
  ticket.lastActivityAt = new Date();
  if (status === 'Resolved') {
    ticket.unreadByUser = true;
  }
  await ticket.save();

  await createAndNotify(req.app, {
    recipient: ticket.userId,
    title: 'Ticket status updated',
    message: `${ticket.ticketId} is now ${status}`,
    type: 'personal',
    link: '/dashboard/support',
  });

  emitTicketUpdate(req, ticket);
  res.json({ success: true, ticket });
});

// @desc    Assign ticket (admin only)
// @route   PATCH /api/support-tickets/:id/assign
const assignTicket = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only Super Admin can assign tickets');
  }

  const { assignedTo } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (!assignedTo) {
    ticket.assignedTo = null;
    ticket.assignedToName = '';
  } else {
    const assignee = await User.findById(assignedTo);
    if (!assignee || !['admin', 'partner'].includes(assignee.role)) {
      res.status(400);
      throw new Error('Invalid assignee');
    }
    ticket.assignedTo = assignee._id;
    ticket.assignedToName = assignee.name || assignee.email;
    ticket.unreadByStaff = true;

    await createAndNotify(req.app, {
      recipient: assignee._id,
      title: 'Ticket assigned to you',
      message: ticket.subject,
      type: 'personal',
      link:
        assignee.role === 'partner'
          ? '/partner/dashboard/support-inbox'
          : '/admin/dashboard/support-inbox',
    });
  }

  ticket.lastActivityAt = new Date();
  await ticket.save();
  emitTicketUpdate(req, ticket);
  res.json({ success: true, ticket });
});

// @desc    Delete ticket (admin only)
// @route   DELETE /api/support-tickets/:id
const deleteTicket = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only Super Admin can delete tickets');
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  await ticket.deleteOne();
  res.json({ success: true, message: 'Ticket deleted' });
});

// @desc    Staff list for assignment dropdown
// @route   GET /api/support-tickets/meta/assignees
const getAssignees = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin only');
  }
  const staff = await User.find({
    role: { $in: ['admin', 'partner'] },
    active: { $ne: false },
  }).select('name email role');
  res.json({ success: true, staff });
});

module.exports = {
  createTicket,
  getTickets,
  getUnreadCount,
  getTicket,
  replyTicket,
  updateStatus,
  assignTicket,
  deleteTicket,
  getAssignees,
};
