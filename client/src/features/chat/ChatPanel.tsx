import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useOrderChat } from './useOrderChat'

interface ChatPanelProps {
  orderId: string
  /** compact height for embedding in admin cards */
  compact?: boolean
}

export function ChatPanel({ orderId, compact = false }: ChatPanelProps) {
  const { isAdmin } = useAuth()
  const { messages, connected, peerTyping, error, send, notifyTyping } = useOrderChat(orderId)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const myRole = isAdmin ? 'admin' : 'customer'
  const peerName = isAdmin ? 'Customer' : 'Darzi'

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages.length, peerTyping])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    const ok = await send(text)
    if (ok) setDraft('')
    setSending(false)
  }

  return (
    <section
      aria-label="Order chat"
      className="border border-border rounded-lg bg-surface flex flex-col"
    >
      <header className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-medium text-primary text-sm">Chat with {peerName}</h3>
        <span
          className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-border'}`}
          aria-label={connected ? 'Connected' : 'Connecting'}
        />
      </header>

      <div
        ref={listRef}
        className={`flex-1 overflow-y-auto px-4 py-3 space-y-2 ${compact ? 'h-56' : 'h-72'}`}
        aria-live="polite"
      >
        {messages.length === 0 && !error && (
          <p className="text-sm text-secondary text-center py-8">
            No messages yet — ask about fittings, fabric, or timing.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderRole === myRole
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                  mine
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-muted text-primary rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          )
        })}
        {peerTyping && (
          <p className="text-xs text-secondary italic" role="status">
            {peerName} is typing…
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="px-4 py-2 text-xs text-destructive border-t border-border">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="p-3 border-t border-border flex gap-2">
        <label htmlFor={`chat-input-${orderId}`} className="sr-only">
          Message
        </label>
        <input
          id={`chat-input-${orderId}`}
          type="text"
          maxLength={2000}
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            notifyTyping()
          }}
          disabled={!connected}
          className="flex-1 px-3.5 py-2 bg-background border border-border rounded-full text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!connected || sending || !draft.trim()}
          className="px-4 py-2 bg-primary text-white rounded-full text-sm transition-colors duration-150 cursor-pointer hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Send
        </button>
      </form>
    </section>
  )
}
