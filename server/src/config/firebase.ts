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
      'FIREBASE_SERVICE_ACCOUNT_B64 is not set. Add it to server/.env (service account JSON, raw or base64).',
    )
  }
  // Accepts the raw service account JSON or its base64 encoding — raw JSON is
  // far less likely to get mangled when pasted into hosting dashboards.
  const raw = env.FIREBASE_SERVICE_ACCOUNT_B64.trim()
  let serviceAccount: object
  try {
    serviceAccount = raw.startsWith('{')
      ? JSON.parse(raw)
      : JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_B64 could not be parsed — re-paste the service account JSON (raw or base64).',
    )
  }
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
