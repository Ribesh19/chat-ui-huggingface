import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import crypto from 'crypto';
import { 
  FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY
} from '$env/static/private';

// Initialize Firebase Admin
let adminApp;

try {
  if (!getApps().length) {
    const serviceAccount: ServiceAccount = {
      projectId: FIREBASE_ADMIN_PROJECT_ID || 'previsely',
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    // Validate required fields
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Missing Firebase Admin SDK credentials. Check your environment variables.');
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket: 'previsely.firebasestorage.app'
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    adminApp = getApps()[0];
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error);
  throw error;
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);
const adminStorage = getStorage(adminApp);

// Answer hashing for security
export function hashAnswer(answer: string): string {
  return crypto
    .createHash('sha256')
    .update(answer.toLowerCase().trim())
    .digest('hex');
}

export function verifyAnswer(userAnswer: string, hashedAnswer: string): boolean {
  const userHash = hashAnswer(userAnswer);
  return userHash === hashedAnswer;
}

// Custom token generation for secure authentication
export async function createCustomToken(uid: string, claims?: object) {
  try {
    return await adminAuth.createCustomToken(uid, claims);
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
}

// Verify ID token from client
export async function verifyIdToken(idToken: string) {
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}

export { adminApp, adminAuth, adminDb, adminStorage };