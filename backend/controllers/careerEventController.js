const asyncHandler = require('express-async-handler');
const CareerEvent = require('../models/CareerEvent');
const { createAndNotify } = require('../utils/notificationHelper');

// @desc    Get upcoming/live career events
// @route   GET /api/career-events
// @access  Public (optional auth)
const getCareerEvents = asyncHandler(async (req, res) => {
  const events = await CareerEvent.find({
    status: { $in: ['upcoming', 'live'] },
  }).sort({ eventDate: 1 });
  res.json(events);
});

// @desc    Get a single career event
// @route   GET /api/career-events/:id
// @access  Public (optional auth)
const getCareerEventById = asyncHandler(async (req, res) => {
  const event = await CareerEvent.findById(req.params.id).populate('registeredUsers', 'name email');
  if (!event) {
    res.status(404);
    throw new Error('Career event not found');
  }
  res.json(event);
});

// @desc    Create a career event (admin)
// @route   POST /api/career-events
// @access  Private/Admin
const createCareerEvent = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    eventType,
    host,
    eventDate,
    registrationDeadline,
    meetLink,
    maxParticipants,
    status,
  } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Title is required');
  }

  const event = await CareerEvent.create({
    title,
    description,
    eventType,
    host,
    eventDate: eventDate || null,
    registrationDeadline: registrationDeadline || null,
    meetLink,
    maxParticipants,
    status,
    createdBy: req.user.id,
  });

  // Global broadcast notification (no specific recipient)
  await createAndNotify(req.app, {
    recipient: null,
    title: 'New Career Event',
    message: `${title} — ${eventType || 'event'} is now available. Register now!`,
    type: 'info',
    priority: 'medium',
    link: `/career-events/${event._id}`,
  });

  res.status(201).json(event);
});

// @desc    Update a career event (admin)
// @route   PUT /api/career-events/:id
// @access  Private/Admin
const updateCareerEvent = asyncHandler(async (req, res) => {
  const event = await CareerEvent.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Career event not found');
  }

  const fields = [
    'title', 'description', 'eventType', 'host', 'eventDate',
    'registrationDeadline', 'meetLink', 'maxParticipants', 'status',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) event[f] = req.body[f];
  });

  const updated = await event.save();
  res.json(updated);
});

// @desc    Delete a career event (admin)
// @route   DELETE /api/career-events/:id
// @access  Private/Admin
const deleteCareerEvent = asyncHandler(async (req, res) => {
  const event = await CareerEvent.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Career event not found');
  }
  await event.deleteOne();
  res.json({ message: 'Career event removed' });
});

// @desc    Register for a career event
// @route   POST /api/career-events/:id/register
// @access  Private
const registerForEvent = asyncHandler(async (req, res) => {
  const event = await CareerEvent.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Career event not found');
  }

  if (event.maxParticipants > 0 && event.registeredUsers.length >= event.maxParticipants) {
    res.status(400);
    throw new Error('Event is full');
  }

  await CareerEvent.findByIdAndUpdate(req.params.id, {
    $addToSet: { registeredUsers: req.user.id },
  });

  await createAndNotify(req.app, {
    recipient: req.user.id,
    title: 'Event Registration Confirmed',
    message: `You are registered for "${event.title}"${event.eventDate ? ` on ${new Date(event.eventDate).toLocaleDateString()}` : ''}.`,
    type: 'success',
    priority: 'medium',
    link: `/career-events/${event._id}`,
  });

  res.json({ message: 'Registered successfully' });
});

// @desc    Unregister from a career event
// @route   DELETE /api/career-events/:id/register
// @access  Private
const unregisterFromEvent = asyncHandler(async (req, res) => {
  const event = await CareerEvent.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Career event not found');
  }

  await CareerEvent.findByIdAndUpdate(req.params.id, {
    $pull: { registeredUsers: req.user.id },
  });

  res.json({ message: 'Unregistered successfully' });
});

module.exports = {
  getCareerEvents,
  getCareerEventById,
  createCareerEvent,
  updateCareerEvent,
  deleteCareerEvent,
  registerForEvent,
  unregisterFromEvent,
};
