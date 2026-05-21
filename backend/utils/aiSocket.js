const emitAIUpdate = (req, userId, event, payload) => {
  try {
    const io = req.app.get('io');
    if (io && userId) {
      io.to(`user:${userId}`).emit(event, payload);
      io.emit(`ai:${userId}:${event}`, payload);
    }
  } catch (e) {
    console.warn('[AI Socket]', e.message);
  }
};

module.exports = { emitAIUpdate };
