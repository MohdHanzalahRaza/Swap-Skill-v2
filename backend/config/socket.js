const setupSocket = (io) => {
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User connects with their userId
    socket.on('user_connected', (userId) => {
      if (!userId) return;

      const userIdStr = userId.toString();
      activeUsers.set(userIdStr, socket.id);
      socket.userId = userIdStr;
      socket.join(userIdStr);

      console.log(`✅ User ${userIdStr} connected (Socket: ${socket.id})`);
      console.log(`👥 Active users: ${activeUsers.size}`);

      // Broadcast online status
      io.emit('user_status', {
        userId: userIdStr,
        status: 'online',
      });
    });

    // Typing indicator
    socket.on('typing', ({ receiverId, isTyping }) => {
      if (!receiverId) return;
      const receiverIdStr = receiverId.toString();
      io.to(receiverIdStr).emit('user_typing', {
        userId: socket.userId,
        isTyping,
      });
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
        console.log(`👥 Active users: ${activeUsers.size}`);
      }
    });
  });

  // Helper to emit notification to specific user
  const emitToUser = (userId, event, data) => {
    const userIdStr = userId.toString();
    console.log(`📤 Emitting ${event} to user ${userIdStr}`);
    io.to(userIdStr).emit(event, data);
  };

  // Helper to get online users
  const getActiveUsers = () => Array.from(activeUsers.keys());

  return {
    io,
    emitToUser,
    getActiveUsers,
  };
};

module.exports = setupSocket;