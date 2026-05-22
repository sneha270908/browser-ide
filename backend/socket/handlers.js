/**
 * Socket.io Event Handlers
 * Manages real-time collaboration rooms per project
 */

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a project room for real-time updates
    socket.on('join:project', ({ projectId, userId }) => {
      socket.join(`project:${projectId}`);
      socket.projectId = projectId;
      socket.userId = userId;

      // Notify others in the room
      socket.to(`project:${projectId}`).emit('user:joined', {
        userId,
        socketId: socket.id,
      });

      console.log(`👤 User ${userId} joined project:${projectId}`);
    });

    // Leave project room
    socket.on('leave:project', ({ projectId }) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:left', {
        socketId: socket.id,
      });
    });

    // Real-time code sync (broadcast to others in room)
    socket.on('code:change', ({ projectId, fileId, content, userId }) => {
      socket.to(`project:${projectId}`).emit('code:change', {
        fileId,
        content,
        userId,
      });
    });

    // Cursor position broadcast
    socket.on('cursor:move', ({ projectId, fileId, position, userId }) => {
      socket.to(`project:${projectId}`).emit('cursor:move', {
        fileId,
        position,
        userId,
        socketId: socket.id,
      });
    });

    // Terminal command broadcast
    socket.on('terminal:command', ({ projectId, command, output }) => {
      socket.to(`project:${projectId}`).emit('terminal:output', {
        command,
        output,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.projectId) {
        socket.to(`project:${socket.projectId}`).emit('user:left', {
          socketId: socket.id,
          userId: socket.userId,
        });
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupSocketHandlers };
