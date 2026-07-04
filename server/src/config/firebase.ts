import { initializeApp, cert, getApps, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore'
import { env } from './env.js'

let app: App | null = null

function getApp(): App {
  if (app) return app
  if (getApps().length > 0) {
    app = getApps()[0]
    return app
  }
  if (!env.FIREBASE_SERVICE_ACCOUNT_B64) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_B64 is not set. Add it to server/.env (base64 of the service account JSON).',
    )
  }
  const serviceAccount = JSON.parse(
    Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'),
  )
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
  })
  return app
}

export function getAuthAdmin(): Auth {
  return getAuth(getApp())
}

export function getDb(): Firestore {
  return getFirestore(getApp())
}

export function serverTimestamp() {
  return FieldValue.serverTimestamp()
}
