const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const compression = require('compression');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const setupSocket = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to database
connectDB();

// Setup Socket.io and store the setup object
const socketSetup = setupSocket(io);
app.set('socketSetup', socketSetup);

// Middleware
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/exchanges', require('./routes/exchanges'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/bookings', require('./routes/bookings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SwapSkillz API is running',
    timestamp: new Date().toISOString(),
    activeUsers: socketSetup.getActiveUsers().length
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SwapSkillz API v2.0',
    docs: '/api/health',
    version: '2.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('🚀 SwapSkillz API v2.0');
  console.log('='.repeat(50));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`💬 Socket.io: Ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
  console.log('');
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...');
  console.log('Error:', err.name, err.message);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => console.log('✅ Process terminated!'));
});