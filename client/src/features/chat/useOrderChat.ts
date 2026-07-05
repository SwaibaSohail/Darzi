import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from '../../context/SocketContext'
import { apiFetch } from '../../lib/api'

export interface ChatMessage {
  id: string
  senderId: string
  senderRole: 'customer' | 'admin'
  text: string
  createdAt: unknown
}

interface UseOrderChatResult {
  messages: ChatMessage[]
  connected: boolean
  peerTyping: boolean
  error: string
  send: (text: string) => Promise<boolean>
  notifyTyping: () => void
}

/**
 * Joins the order room, loads history over REST (source of truth), appends
 * live messages deduped by id, and marks the thread read on open.
 */
export function useOrderChat(orderId: string): UseOrderChatResult {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [error, setError] = useState('')
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSent = useRef(0)

  useEffect(() => {
    if (!socket) return
    let active = true

    socket.emit('chat:join', { orderId }, (res: { ok: boolean; error?: string }) => {
      if (!active) return
      if (!res.ok) {
        setError(res.error ?? 'Could not open the chat')
        return
      }
      setConnected(true)
    })

    apiFetch<{ items: ChatMessage[] }>(`/api/orders/${orderId}/messages`)
      .then((res) => {
        if (active) setMessages(res.items)
      })
      .catch(() => {
        if (active) setError('Could not load messages')
      })

    apiFetch(`/api/orders/${orderId}/messages/read`, { method: 'POST' }).catch(() => {})
    queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })

    const onMessage = (payload: { orderId: string; message: ChatMessage }) => {
      if (payload.orderId !== orderId) return
      setMessages((prev) =>
        prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message],
      )
      setPeerTyping(false)
      apiFetch(`/api/orders/${orderId}/messages/read`, { method: 'POST' }).catch(() => {})
    }

    const onTyping = (payload: { orderId: string }) => {
      if (payload.orderId !== orderId) return
      setPeerTyping(true)
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => setPeerTyping(false), 2500)
    }

    socket.on('chat:message', onMessage)
    socket.on('chat:typing', onTyping)

    return () => {
      active = false
      socket.emit('chat:leave', { orderId })
      socket.off('chat:message', onMessage)
      socket.off('chat:typing', onTyping)
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      setConnected(false)
      setMessages([])
    }
  }, [socket, orderId, queryClient])

  const send = useCallback(
    (text: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!socket) return resolve(false)
        socket.emit(
          'chat:send',
          { orderId, text },
          (res: { ok: boolean; error?: string; message?: ChatMessage }) => {
            if (!res.ok) {
              setError(res.error ?? 'Message failed')
              resolve(false)
              return
            }
            setError('')
            if (res.message) {
              const message = res.message
              setMessages((prev) =>
                prev.some((m) => m.id === message.id) ? prev : [...prev, message],
              )
            }
            resolve(true)
          },
        )
      })
    },
    [socket, orderId],
  )

  const notifyTyping = useCallback(() => {
    if (!socket) return
    const now = Date.now()
    if (now - lastTypingSent.current < 1500) return
    lastTypingSent.current = now
    socket.emit('chat:typing', { orderId })
  }, [socket, orderId])

  return { messages, connected, peerTyping, error, send, notifyTyping }
}
