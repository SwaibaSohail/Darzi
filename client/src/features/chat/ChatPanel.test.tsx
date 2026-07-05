import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPanel } from './ChatPanel'
import { useOrderChat, type ChatMessage } from './useOrderChat'
import { useAuth } from '../../context/AuthContext'

vi.mock('./useOrderChat', () => ({ useOrderChat: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

const mockUseOrderChat = vi.mocked(useOrderChat)
const mockUseAuth = vi.mocked(useAuth)
const send = vi.fn()

function message(id: string, over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    senderId: 'u1',
    senderRole: 'customer',
    text: `msg ${id}`,
    createdAt: 'ts',
    ...over,
  }
}

function setup(messages: ChatMessage[] = [], over: Record<string, unknown> = {}) {
  mockUseAuth.mockReturnValue({ isAdmin: false } as ReturnType<typeof useAuth>)
  mockUseOrderChat.mockReturnValue({
    messages,
    connected: true,
    peerTyping: false,
    error: '',
    send,
    notifyTyping: vi.fn(),
    ...over,
  } as ReturnType<typeof useOrderChat>)
  return render(<ChatPanel orderId="o1" />)
}

beforeEach(() => {
  send.mockReset()
})

describe('ChatPanel', () => {
  it('renders history from both sides', () => {
    setup([message('1'), message('2', { senderRole: 'admin', text: 'Ready Thursday' })])
    expect(screen.getByText('msg 1')).toBeInTheDocument()
    expect(screen.getByText('Ready Thursday')).toBeInTheDocument()
  })

  it('renders hostile message content as inert text, not markup', () => {
    const payload = '<img src=x onerror="window.hacked=true">'
    setup([message('1', { text: payload })])
    expect(screen.getByText(payload)).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
    expect((window as { hacked?: boolean }).hacked).toBeUndefined()
  })

  it('sends trimmed drafts and clears on success', async () => {
    send.mockResolvedValue(true)
    setup()
    const input = screen.getByLabelText('Message')
    await userEvent.type(input, '  need it by eid  ')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(send).toHaveBeenCalledWith('need it by eid')
    expect(input).toHaveValue('')
  })

  it('disables send when empty', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })
})
