const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const mentalHealthRoutes = require('./routes/mentalHealth.routes');
const taskRoutes = require('./routes/task.routes');
const wellnessRoutes = require('./routes/wellness.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const gpaRoutes = require('./routes/gpaRoutes');
const scheduleRoutes = require('./routes/schedule.routes');
const timetableRoutes = require('./routes/timetable.routes');
const exportRoutes = require('./routes/export.routes');

// Import services
const { runDailyPredictions } = require('./services/ml/predictionService');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('server/uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mental-health', mentalHealthRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gpa', gpaRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/templates', timetableRoutes);
app.use('/api/export', exportRoutes);

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
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB connection string is missing in .env');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
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
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Stop the existing process or change PORT in .env.`);
      process.exit(1);
    }

    console.error('❌ Server startup error:', error.message);
    process.exit(1);
  });
});

module.exports = app;