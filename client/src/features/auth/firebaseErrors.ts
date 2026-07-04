const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak — use at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
}

export function firebaseErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const mapped = MESSAGES[(err as { code: string }).code]
    if (mapped) return mapped
  }
  return 'Something went wrong. Please try again.'
}
