const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const mentalHealthRoutes = require('./routes/mentalHealth.routes');
const mentalHealthAdvancedRoutes = require('./routes/mentalHealthAdvanced.routes');
const taskRoutes = require('./routes/task.routes');
const wellnessRoutes = require('./routes/wellness.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const voiceCheckinRoutes = require('./routes/voiceCheckin.routes');

// Import services
const { runDailyPredictions } = require('./services/ml/predictionService');

// Import socket configuration
const { initSocket } = require('./config/socket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);
console.log('🔌 Socket.io initialized');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('server/uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mental-health', mentalHealthRoutes);
app.use('/api/mental-health/v2', mentalHealthAdvancedRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/checkin', voiceCheckinRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-modock');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Schedule daily stress predictions (runs at 6 AM every day)
cron.schedule('0 6 * * *', async () => {
  console.log('🔄 Running daily stress predictions...');
  await runDailyPredictions();
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 WebSocket ready for real-time updates`);
  });
});

module.exports = { app, server, io };
