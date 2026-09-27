// Firebase Authentication for the member portal. Loaded only when the portal is opened, so the
// rest of the site stays small. The web config comes from /__/firebase/init.json, which Firebase
// Hosting publishes for the project (Netlify and the dev server forward it), so no keys live here.
let authPromise = null

export function getMemberAuth() {
  if (!authPromise) {
    authPromise = (async () => {
      const [{ initializeApp }, authModule] = await Promise.all([import('firebase/app'), import('firebase/auth')])
      const response = await fetch('/__/firebase/init.json', { cache: 'no-store' })
      if (!response.ok) throw new Error(`Firebase config unavailable (${response.status})`)
      const app = initializeApp(await response.json())
      const auth = authModule.getAuth(app)
      // Local development signs in against the Auth emulator started by `npm run serve` in functions/.
      if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR !== 'off') {
        authModule.connectAuthEmulator(auth, `http://${import.meta.env.VITE_FIREBASE_AUTH_EMULATOR || '127.0.0.1:9099'}`, {
          disableWarnings: true,
        })
      }
      return { auth, ...authModule }
    })().catch((error) => {
      authPromise = null
      throw error
    })
  }
  return authPromise
}

const AUTH_ERRORS = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-login-credentials': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/missing-password': 'Please enter your password.',
  'auth/email-already-in-use': 'An account with this email already exists. Log in instead, or reset your password.',
  'auth/weak-password': 'Please choose a stronger password (at least 8 characters).',
  'auth/password-does-not-meet-requirements': 'Please choose a stronger password (at least 8 characters).',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes, or reset your password.',
  'auth/user-disabled': 'This account has been turned off. Please contact support.',
  'auth/network-request-failed': "We couldn't reach Aura Tap. Check your internet connection and try again.",
}

export function authErrorMessage(error) {
  return AUTH_ERRORS[error?.code] || error?.message || 'Something went wrong. Please try again.'
}
