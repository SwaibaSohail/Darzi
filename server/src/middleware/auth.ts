import type { Request, Response, NextFunction } from 'express'
import { getAuthAdmin } from '../config/firebase.js'

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing bearer token' } })
    return
  }
  const token = header.slice('Bearer '.length)
  try {
    const decoded = await getAuthAdmin().verifyIdToken(token)
    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      isAdmin: decoded.admin === true,
    }
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } })
    return
  }
  next()
}
