import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  type Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  type Firestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  connectStorageEmulator,
  type FirebaseStorage 
} from 'firebase/storage';
import { 
  getAnalytics, 
  type Analytics 
} from 'firebase/analytics';
import { browser } from '$app/environment';
import { 
  PUBLIC_FIREBASE_API_KEY,
  PUBLIC_FIREBASE_AUTH_DOMAIN,
  PUBLIC_FIREBASE_PROJECT_ID,
  PUBLIC_FIREBASE_STORAGE_BUCKET,
  PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  PUBLIC_FIREBASE_APP_ID,
  PUBLIC_FIREBASE_MEASUREMENT_ID
} from '$env/static/public';

const firebaseConfig = {
  apiKey: PUBLIC_FIREBASE_API_KEY,
  authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: PUBLIC_FIREBASE_APP_ID,
  measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | undefined;

// Initialize Firebase only once
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

// Initialize Analytics only in browser
if (browser && PUBLIC_FIREBASE_MEASUREMENT_ID) {
  analytics = getAnalytics(app);
}

// Connect to emulators in development
if (import.meta.env.DEV && browser) {
  const isEmulatorConnected = localStorage.getItem('firebase-emulator-connected');
  
  if (!isEmulatorConnected) {
    try {
      // Uncomment these lines if you're using Firebase emulators
      // connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      // connectFirestoreEmulator(db, 'localhost', 8080);
      // connectStorageEmulator(storage, 'localhost', 9199);
      
      localStorage.setItem('firebase-emulator-connected', 'true');
    } catch (error) {
      console.warn('Failed to connect to Firebase emulators:', error);
    }
  }
}

export { app, auth, db, storage, analytics };