import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Firebase client config is public by design — security lives in the
// deny-all Firestore/Storage rules and server-side token verification.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (!config.apiKey) {
  console.warn('Firebase client config missing — set VITE_FIREBASE_* in client/.env')
}

const app = initializeApp(config)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
