import * as functions from 'firebase-functions'
import { app } from './app.js'

// Firebase Hosting rewrites /api/** to this function (see firebase.json).
export const api = functions.https.onRequest(app)
