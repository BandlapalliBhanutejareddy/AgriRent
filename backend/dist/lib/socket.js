"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToUser = exports.getIo = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const userSockets = new Map(); // Maps userId to socketId
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // Adjust for production
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);
        // Expecting the client to emit a 'register' event with their userId upon connection
        socket.on('register', (userId) => {
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
exports.initSocket = initSocket;
const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
exports.getIo = getIo;
const emitToUser = (userId, event, data) => {
    if (!io)
        return;
    const socketId = userSockets.get(userId);
    if (socketId) {
        io.to(socketId).emit(event, data);
    }
};
exports.emitToUser = emitToUser;
