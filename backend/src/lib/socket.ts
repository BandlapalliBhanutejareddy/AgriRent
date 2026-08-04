import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;
const userSockets = new Map<string, string>(); // Maps userId to socketId

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Expecting the client to emit a 'register' event with their userId upon connection
    socket.on('register', (userId: string) => {
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Remove from map if disconnected
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
    });
  });
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};
