import type { Server, Socket } from 'socket.io'
import { z } from 'zod'
import { getOrderForChat, addMessage } from '../modules/chat/service.js'
import logger from '../lib/logger.js'
import type { SocketAuth } from './io.js'

const joinSchema = z.object({ orderId: z.string().trim().min(1).max(60) })
const sendSchema = z.object({
  orderId: z.string().trim().min(1).max(60),
  text: z.string().min(1).max(2000),
})

const RATE_LIMIT = { windowMs: 10_000, max: 10 }

type Ack = (response: { ok: boolean; error?: string; message?: unknown }) => void

export function registerChatHandlers(io: Server, socket: Socket): void {
  const auth = socket.data.auth as SocketAuth
  let sentTimestamps: number[] = []

  socket.on('chat:join', async (payload, ack?: Ack) => {
    const parsed = joinSchema.safeParse(payload)
    if (!parsed.success) return ack?.({ ok: false, error: 'Invalid request' })
    // Room membership is authorization — verified against Firestore, not the client.
    const order = await getOrderForChat(auth.uid, auth.isAdmin, parsed.data.orderId)
    if (!order) return ack?.({ ok: false, error: 'Order not found' })
    await socket.join(`order:${order.id}`)
    ack?.({ ok: true })
  })

  socket.on('chat:leave', (payload) => {
    const parsed = joinSchema.safeParse(payload)
    if (parsed.success) socket.leave(`order:${parsed.data.orderId}`)
  })

  socket.on('chat:send', async (payload, ack?: Ack) => {
    try {
      const parsed = sendSchema.safeParse(payload)
      if (!parsed.success) return ack?.({ ok: false, error: 'Message must be 1–2000 characters' })
      const text = parsed.data.text.trim()
      if (!text) return ack?.({ ok: false, error: 'Message must be 1–2000 characters' })

      if (!socket.rooms.has(`order:${parsed.data.orderId}`)) {
        return ack?.({ ok: false, error: 'Join the chat first' })
      }

      const now = Date.now()
      sentTimestamps = sentTimestamps.filter((t) => now - t < RATE_LIMIT.windowMs)
      if (sentTimestamps.length >= RATE_LIMIT.max) {
        return ack?.({ ok: false, error: 'Slow down — too many messages' })
      }
      sentTimestamps.push(now)

      const message = await addMessage(parsed.data.orderId, auth, text)

      io.to(`order:${parsed.data.orderId}`).emit('chat:message', {
        orderId: parsed.data.orderId,
        message,
      })
      // Counterpart badge update: customer messages ping admins and vice versa.
      const order = await getOrderForChat(auth.uid, auth.isAdmin, parsed.data.orderId)
      if (order) {
        const target = auth.isAdmin ? `user:${order.userId}` : 'admin'
        io.to(target).emit('chat:unread', { orderId: parsed.data.orderId })
      }
      ack?.({ ok: true, message })
    } catch (err) {
      logger.error(err, 'chat:send failed')
      ack?.({ ok: false, error: 'Could not send the message' })
    }
  })

  socket.on('chat:typing', (payload) => {
    const parsed = joinSchema.safeParse(payload)
    if (!parsed.success) return
    if (!socket.rooms.has(`order:${parsed.data.orderId}`)) return
    socket.volatile.to(`order:${parsed.data.orderId}`).emit('chat:typing', {
      orderId: parsed.data.orderId,
      role: auth.isAdmin ? 'admin' : 'customer',
    })
  })
}
