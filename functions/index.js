import { onRequest } from 'firebase-functions/v2/https'
import { app } from './app.js'

// Firebase Hosting rewrites /api/** to this function (see firebase.json), and Netlify forwards
// aurataps.net/api/** to Firebase Hosting (see netlify.toml).
export const apiV2 = onRequest({ region: 'us-central1' }, app)
