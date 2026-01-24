import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger'

interface AuthenticatedSocket extends Socket {
  userId?: string
  userRole?: string
}

export const setupSocket = (io: Server): void => {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default_secret'
      ) as { userId: string; role: string }

      socket.userId = decoded.userId
      socket.userRole = decoded.role
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId}`)

    // Join user's personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`)
    }

    // Join classroom
    socket.on('join:classroom', (classroomId: string) => {
      socket.join(`classroom:${classroomId}`)
      logger.info(`User ${socket.userId} joined classroom ${classroomId}`)
    })

    // Leave classroom
    socket.on('leave:classroom', (classroomId: string) => {
      socket.leave(`classroom:${classroomId}`)
      logger.info(`User ${socket.userId} left classroom ${classroomId}`)
    })

    // Send message to classroom
    socket.on('message:send', (data: { classroomId: string; content: string }) => {
      io.to(`classroom:${data.classroomId}`).emit('message:new', {
        userId: socket.userId,
        content: data.content,
        timestamp: new Date().toISOString(),
      })
    })

    // Typing indicator
    socket.on('typing:start', (classroomId: string) => {
      socket.to(`classroom:${classroomId}`).emit('typing:user', {
        userId: socket.userId,
        isTyping: true,
      })
    })

    socket.on('typing:stop', (classroomId: string) => {
      socket.to(`classroom:${classroomId}`).emit('typing:user', {
        userId: socket.userId,
        isTyping: false,
      })
    })

    // Document events
    socket.on('document:view', (documentId: string) => {
      socket.join(`document:${documentId}`)
    })

    socket.on('document:comment', (data: { documentId: string; comment: string }) => {
      io.to(`document:${data.documentId}`).emit('document:comment:new', {
        userId: socket.userId,
        comment: data.comment,
        timestamp: new Date().toISOString(),
      })
    })

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`)
    })
  })

  logger.info('Socket.io configured')
}

// Helper function to send notification to user
export const sendNotification = (
  io: Server,
  userId: string,
  notification: {
    title: string
    message: string
    type: string
    data?: Record<string, unknown>
  }
): void => {
  io.to(`user:${userId}`).emit('notification', notification)
}

// Helper function to broadcast to classroom
export const broadcastToClassroom = (
  io: Server,
  classroomId: string,
  event: string,
  data: Record<string, unknown>
): void => {
  io.to(`classroom:${classroomId}`).emit(event, data)
}
