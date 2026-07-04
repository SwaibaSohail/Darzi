/**
 * Grants the admin custom claim to a Firebase user by email.
 * Run locally with the service account configured in server/.env:
 *   npx tsx src/scripts/grantAdmin.ts admin@example.com
 * There is deliberately NO API endpoint for this — roles are set only here.
 */
import { getAuthAdmin, getDb } from '../config/firebase.js'

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx src/scripts/grantAdmin.ts <email>')
  process.exit(1)
}

try {
  const user = await getAuthAdmin().getUserByEmail(email)
  await getAuthAdmin().setCustomUserClaims(user.uid, { admin: true })
  await getDb().collection('users').doc(user.uid).set({ role: 'admin' }, { merge: true })
  console.log(`Admin claim granted to ${email} (uid: ${user.uid})`)
  console.log('The user must sign out and back in (or refresh their token) to pick it up.')
} catch (err) {
  console.error('Failed to grant admin:', err instanceof Error ? err.message : err)
  process.exit(1)
}
