import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketHandlers(io: Server) {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join course rooms
    socket.on('join_course', (courseId: string) => {
      socket.join(`course:${courseId}`);
      console.log(`User ${socket.userId} joined course:${courseId}`);
    });

    // Leave course rooms
    socket.on('leave_course', (courseId: string) => {
      socket.leave(`course:${courseId}`);
    });

    // Join event rooms
    socket.on('join_event', (eventId: string) => {
      socket.join(`event:${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
}

// Helper functions to emit events
export function emitNewEvent(io: Server, event: any) {
  io.emit('event:new', event);
}

export function emitEventUpdate(io: Server, eventId: string, event: any) {
  io.to(`event:${eventId}`).emit('event:updated', event);
}

export function emitNewResource(io: Server, courseId: string, resource: any) {
  io.to(`course:${courseId}`).emit('resource:new', resource);
}

export function emitExpenseUpdate(io: Server, userId: string, expense: any) {
  io.to(`user:${userId}`).emit('expense:new', expense);
}

export function emitWellbeingUpdate(io: Server, userId: string, data: any) {
  io.to(`user:${userId}`).emit('wellbeing:update', data);
}

export function emitNotification(io: Server, userId: string, notification: any) {
  io.to(`user:${userId}`).emit('notification:new', notification);
}
