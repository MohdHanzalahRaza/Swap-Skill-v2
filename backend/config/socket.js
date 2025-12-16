const setupSocket = (io) => {
  // Map to store online users (userId → socketId)
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User joins with userId
    socket.on('user_connected', (userId) => {
      if (!userId) return;

      activeUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(userId);

      console.log(`✅ User ${userId} is online`);

      // Broadcast user online status
      io.emit('user_status', {
        userId,
        status: 'online',
      });
    });

    // Send message
    socket.on('send_message', ({ senderId, receiverId, message }) => {
      if (!receiverId || !message) return;

      io.to(receiverId).emit('receive_message', {
        senderId,
        message,
        createdAt: new Date(),
      });
    });

    // Typing indicator
    socket.on('typing', ({ receiverId, isTyping }) => {
      if (!receiverId) return;

      io.to(receiverId).emit('user_typing', {
        userId: socket.userId,
        isTyping,
      });
    });

    // Exchange request notification
    socket.on('exchange_request', ({ receiverId, exchange }) => {
      if (!receiverId) return;
      io.to(receiverId).emit('new_exchange_request', exchange);
    });

    // Exchange status update
    socket.on('exchange_status_update', ({ userId, exchange }) => {
      if (!userId) return;
      io.to(userId).emit('exchange_updated', exchange);
    });

    // Custom notification
    socket.on('send_notification', ({ userId, notification }) => {
      if (!userId) return;
      io.to(userId).emit('new_notification', notification);
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        activeUsers.delete(socket.userId);

        io.emit('user_status', {
          userId: socket.userId,
          status: 'offline',
        });

        console.log(`👋 User ${socket.userId} disconnected`);
      }
    });
  });

  // Utility: get currently online users
  const getActiveUsers = () => Array.from(activeUsers.keys());

  return {
    io,
    getActiveUsers,
  };
};

module.exports = setupSocket;