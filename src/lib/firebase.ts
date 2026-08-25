import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'

/** Public web SDK config for nammakural-b1878 (safe to ship; rules protect data). */
const LIVE_CONFIG = {
  apiKey: 'AIzaSyCJQT6P_l8qz7NMlGC_aSZ_mdpChOnbRus',
  authDomain: 'nammakural-b1878.firebaseapp.com',
  projectId: 'nammakural-b1878',
  storageBucket: 'nammakural-b1878.firebasestorage.app',
  messagingSenderId: '341110473535',
  appId: '1:341110473535:web:a32b1800e8c6d777e6098a',
}

function envValue(value: string | undefined) {
  if (!value || value === 'your_api_key' || value === 'demo-api-key') return ''
  return value
}

const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
const envConfig = {
  apiKey: envValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: envValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: envValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: envValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: envValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: envValue(import.meta.env.VITE_FIREBASE_APP_ID),
}

const firebaseConfig = useEmulator
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
  : envConfig.apiKey
    ? envConfig
    : LIVE_CONFIG

export const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let emulatorsConnected = false

if (!useMockData) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  if (useEmulator && !emulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectStorageEmulator(storage, '127.0.0.1', 9199)
    emulatorsConnected = true
  }
}

export { app, auth, db, storage, useEmulator }

/**
 * Multi-village architecture:
 * Firestore collections are scoped by villageId:
 *   villages/{villageId}
 *   villages/{villageId}/complaints/{id}
 *   villages/{villageId}/announcements/{id}
 *   villages/{villageId}/activityLog/{id}
 *   admins/{uid}  → { villageId, role }
 */
export function villagePath(villageId: string, ...segments: string[]) {
  return ['villages', villageId, ...segments].join('/')
}
