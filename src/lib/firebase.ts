import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { env as publicEnv } from "$env/dynamic/public";

// Read from SvelteKit public runtime env (PUBLIC_*). Make sure .env.local is set.
const config: FirebaseOptions = {
  apiKey: publicEnv.PUBLIC_FIREBASE_API_KEY,
  authDomain: publicEnv.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: publicEnv.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: publicEnv.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: publicEnv.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: publicEnv.PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized already
export const app = getApps().length === 0 ? initializeApp(config) : getApp();


