const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('colors');

process.on('uncaughtException', (err) => {
	console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...'.red.bold);
	console.error(err.name, err.message, err.stack);
	process.exit(1);
});

process.on('unhandledRejection', (err) => {
	console.error('UNHANDLED REJECTION! 💥'.red.bold);
	console.error(err.name, err.message, err.stack);
	// Optionally graceful shutdown here
});

// Login and JWT routes need JWT_SECRET. Missing value makes jsonwebtoken throw → HTTP 500 on /api/auth/login.
if (!process.env.JWT_SECRET) {
	if (process.env.NODE_ENV === 'production') {
		console.error('FATAL: JWT_SECRET must be set in production');
		process.exit(1);
	}
	process.env.JWT_SECRET = 'dev-only-insecure-jwt-secret-change-in-env';
	console.warn('[config] JWT_SECRET not set; using a development default. Add JWT_SECRET to backend/.env for production.');
}

const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const ensureAdminExists = require('./utils/ensureAdmin');
const { startAIServer } = require('./services/aiServiceClient');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io logic
io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);
  
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('joinUser', (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on('joinTicket', (ticketId) => {
    if (ticketId) socket.join(`ticket:${ticketId}`);
  });

  socket.on('sendMessage', (data) => {
    io.to(data.roomId).emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// Set io globally so it can be accessed in controllers if needed
app.set('io', io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/partner', require('./routes/partnerRoutes'));
app.use('/api/internships', require('./routes/internshipRoutes'));
app.use('/api/guides', require('./routes/guideRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/resume', require('./routes/atsRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/stories', require('./routes/successStoryRoutes'));
app.use('/api/site-settings', require('./routes/siteSettingsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/support-tickets', require('./routes/supportTicketRoutes'));
console.log('[Routes] Support tickets API → /api/support-tickets'.cyan);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Local uploads are no longer used; files are stored in Cloudinary

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async () => {
	try {
        console.log('[Bootstrap] Initializing database connection...'.yellow);
		await connectDB();
		await ensureAdminExists();
		startAIServer();
		server.listen(PORT, () => console.log(`Server started on port ${PORT}`.green.bold));
	} catch (err) {
		console.error(`[Bootstrap Error] Server failed to start: ${err.message}`.red);
		process.exit(1);
	}
})();
