import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const SocketContext = createContext<Socket | null>(null)

/**
 * One authenticated socket per signed-in session. Connects after login with a
 * fresh ID token in the handshake, disconnects on logout.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocket(null)
      return
    }

    // auth as a callback: every (re)connection attempt fetches a fresh ID
    // token, so reconnects after the 1-hour token expiry still authenticate.
    const next = io(SOCKET_URL, {
      auth: (cb) => {
        user
          .getIdToken()
          .then((token) => cb({ token }))
          .catch(() => cb({}))
      },
    })
    socketRef.current = next
    setSocket(next)

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [user])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

/** Null when signed out or still connecting. */
export function useSocket(): Socket | null {
  return useContext(SocketContext)
}
