const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join user to their personal room for private updates
    socket.on('join-user-room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined their room`);
      }
    });

    // Join dashboard room for real-time stats
    socket.on('join-dashboard', (userId) => {
      if (userId) {
        socket.join(`dashboard:${userId}`);
        console.log(`📊 User ${userId} joined dashboard room`);
      }
    });

    // Join chat room for real-time messaging
    socket.on('join-chat', (userId) => {
      if (userId) {
        socket.join(`chat:${userId}`);
        console.log(`💬 User ${userId} joined chat room`);
      }
    });

    // Handle mood check-in for real-time updates
    socket.on('mood-checkin', (data) => {
      // Broadcast to user's dashboard
      io.to(`dashboard:${data.userId}`).emit('mood-updated', data);
      console.log(`🎭 Mood update from user ${data.userId}`);
    });

    // Handle task updates
    socket.on('task-update', (data) => {
      io.to(`dashboard:${data.userId}`).emit('task-updated', data);
      console.log(`✅ Task update from user ${data.userId}`);
    });

    // Handle wellness activity
    socket.on('wellness-activity', (data) => {
      io.to(`dashboard:${data.userId}`).emit('wellness-updated', data);
      console.log(`🧘 Wellness update from user ${data.userId}`);
    });

    // Handle chat messages
    socket.on('send-message', (data) => {
      io.to(`chat:${data.userId}`).emit('new-message', {
        ...data,
        timestamp: new Date().toISOString()
      });
      console.log(`💬 Chat message from user ${data.userId}`);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.to(`chat:${data.roomId}`).emit('user-typing', data);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔴 User disconnected: ${socket.id} - Reason: ${reason}`);
    });
  });

  return io;
};

/**
 * Get the Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Emit to a specific user
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit dashboard update to a specific user
 */
const emitDashboardUpdate = (userId, event, data) => {
  if (io) {
    io.to(`dashboard:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Emit chat message to a user
 */
const emitChatMessage = (userId, data) => {
  if (io) {
    io.to(`chat:${userId}`).emit('new-message', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Broadcast to all connected users
 */
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitDashboardUpdate,
  emitChatMessage,
  broadcast
};
