import { getDb, serverTimestamp } from '../../config/firebase.js'
import type { Order } from '../orders/types.js'

export interface ChatMessage {
  id: string
  senderId: string
  senderRole: 'customer' | 'admin'
  text: string
  createdAt: unknown
}

/** Owner or admin — the same rule REST uses; anything else is null. */
export async function getOrderForChat(
  uid: string,
  isAdmin: boolean,
  orderId: string,
): Promise<Order | null> {
  const snap = await getDb().collection('orders').doc(orderId).get()
  if (!snap.exists) return null
  const order = { id: snap.id, ...snap.data() } as Order
  if (order.userId !== uid && !isAdmin) return null
  return order
}

/**
 * Persists the message first (Firestore is the source of truth), then bumps
 * the counterpart's unread counter. Broadcast happens after this resolves.
 */
export async function addMessage(
  orderId: string,
  sender: { uid: string; isAdmin: boolean },
  text: string,
): Promise<ChatMessage> {
  const db = getDb()
  const orderRef = db.collection('orders').doc(orderId)
  const messageRef = orderRef.collection('messages').doc()
  const message = {
    senderId: sender.uid,
    senderRole: sender.isAdmin ? ('admin' as const) : ('customer' as const),
    text,
    createdAt: serverTimestamp(),
  }
  await messageRef.set(message)

  const orderSnap = await orderRef.get()
  const unread = (orderSnap.data() as Order).unread ?? { customer: 0, admin: 0 }
  const counterpart = sender.isAdmin ? 'customer' : 'admin'
  await orderRef.update({
    unread: { ...unread, [counterpart]: (unread[counterpart] ?? 0) + 1 },
  })

  return { id: messageRef.id, ...message, createdAt: new Date().toISOString() }
}

export async function listMessages(
  orderId: string,
  limit: number,
): Promise<ChatMessage[]> {
  const snap = await getDb()
    .collection('orders')
    .doc(orderId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .get()
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage)
  // newest tail of the conversation; pagination can move to cursors if volume grows
  return all.slice(-limit)
}

export async function markRead(orderId: string, role: 'customer' | 'admin'): Promise<void> {
  const ref = getDb().collection('orders').doc(orderId)
  const snap = await ref.get()
  if (!snap.exists) return
  const unread = (snap.data() as Order).unread ?? { customer: 0, admin: 0 }
  await ref.update({ unread: { ...unread, [role]: 0 } })
}
