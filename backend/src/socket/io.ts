import { Server } from 'socket.io';

let io: Server;

export function setIO(ioInstance: Server) {
  io = ioInstance;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
