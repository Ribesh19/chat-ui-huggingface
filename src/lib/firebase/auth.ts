import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  type User,
  type UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './client';
import { COLLECTIONS } from './types';
import type { UserProfile, UserRole, SubscriptionPlan } from './types';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string, 
  password: string, 
  displayName: string,
  grade: number = 5
): Promise<UserCredential> {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName });
    
    // Create user profile in Firestore
    const userProfile: UserProfile = {
      email,
      displayName,
      photoURL: null,
      role: 'student',
      profile: {
        grade,
        preferredSubjects: [],
        learningStyle: 'visual',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language || 'en'
      },
      settings: {
        notifications: true,
        darkMode: false,
        fontSize: 'medium',
        soundEffects: true
      },
      subscription: {
        plan: 'free',
        startDate: serverTimestamp(),
        endDate: serverTimestamp(), // Will be updated based on plan
        features: ['basic_questions', 'progress_tracking']
      },
      stats: {
        totalPoints: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        streak: 0,
        lastActiveDate: serverTimestamp(),
        totalTimeSpent: 0
      },
      achievements: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userProfile);
    
    return userCredential;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last active date
    await updateLastActive(userCredential.user.uid);
    
    return userCredential;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    
    // Check if user profile exists
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    
    if (!userDoc.exists()) {
      // Create new user profile
      const userProfile: UserProfile = {
        email: user.email!,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL,
        role: 'student',
        profile: {
          grade: 5,
          preferredSubjects: [],
          learningStyle: 'visual',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language || 'en'
        },
        settings: {
          notifications: true,
          darkMode: false,
          fontSize: 'medium',
          soundEffects: true
        },
        subscription: {
          plan: 'free',
          startDate: serverTimestamp(),
          endDate: serverTimestamp(),
          features: ['basic_questions', 'progress_tracking']
        },
        stats: {
          totalPoints: 0,
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          streak: 0,
          lastActiveDate: serverTimestamp(),
          totalTimeSpent: 0
        },
        achievements: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userProfile);
    } else {
      // Update last active date
      await updateLastActive(user.uid);
    }
    
    return userCredential;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  const unsubscribe = onAuthStateChanged(auth, callback);
  return unsubscribe;
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    await setDoc(
      doc(db, COLLECTIONS.USERS, userId),
      {
        ...updates,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Update last active date
 */
async function updateLastActive(userId: string): Promise<void> {
  try {
    await setDoc(
      doc(db, COLLECTIONS.USERS, userId),
      {
        'stats.lastActiveDate': serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating last active:', error);
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userProfile = await getUserProfile(userId);
    return userProfile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get ID token for API calls
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const user = getCurrentUser();
    if (!user) return null;
    
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}