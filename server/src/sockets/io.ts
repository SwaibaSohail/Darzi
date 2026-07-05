import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { getAuthAdmin } from '../config/firebase.js'
import { allowedOrigins } from '../config/env.js'
import logger from '../lib/logger.js'
import { registerChatHandlers } from './chatHandlers.js'

export interface SocketAuth {
  uid: string
  isAdmin: boolean
}

let io: Server | null = null

export function initIo(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins },
  })

  // Same trust model as REST: verify the Firebase ID token before anything else.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (typeof token !== 'string' || !token) throw new Error('missing token')
      const decoded = await getAuthAdmin().verifyIdToken(token)
      socket.data.auth = { uid: decoded.uid, isAdmin: decoded.admin === true } satisfies SocketAuth
      next()
    } catch {
      next(new Error('unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const auth = socket.data.auth as SocketAuth
    socket.join(`user:${auth.uid}`)
    if (auth.isAdmin) socket.join('admin')
    registerChatHandlers(io!, socket)
    logger.debug({ uid: auth.uid, admin: auth.isAdmin }, 'socket connected')
  })

  return io
}

/** The initialized Socket.io server; REST handlers use this to emit. */
export function getIo(): Server {
  if (!io) throw new Error('Socket.io not initialized — call initIo(server) first')
  return io
}

/** Null when sockets are not running (e.g. supertest suites) — emits become no-ops. */
export function ioOrNull(): Server | null {
  return io
}
