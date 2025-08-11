import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Unauthorized - Missing authentication token' 
      }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    
    // Verify the user's ID token
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }
    
    const userId = decodedToken.uid;
    const email = decodedToken.email;
    const displayName = decodedToken.name || 'User';

    // Check if user profile already exists
    const existingUser = await adminDb.collection('users').doc(userId).get();
    
    if (existingUser.exists) {
      return json({ 
        success: true, 
        message: 'User profile already exists',
        userId: userId,
        data: existingUser.data()
      });
    }

    // Create new user profile
    const userProfile = {
      email: email,
      displayName: displayName,
      photoURL: decodedToken.picture || null,
      role: email === 'ribeshforu@gmail.com' ? 'admin' : 'student', // Auto-admin for your email
      profile: {
        grade: email === 'ribeshforu@gmail.com' ? 12 : 5,
        age: null,
        school: null,
        preferredSubjects: ['math'],
        learningStyle: 'visual',
        timezone: 'UTC',
        language: 'en'
      },
      settings: {
        notifications: true,
        darkMode: false,
        fontSize: 'medium',
        soundEffects: true
      },
      subscription: {
        plan: email === 'ribeshforu@gmail.com' ? 'enterprise' : 'free',
        startDate: FieldValue.serverTimestamp(),
        features: email === 'ribeshforu@gmail.com' ? 
          ['all_features', 'admin_access', 'unlimited_questions'] : 
          ['basic_questions', 'progress_tracking']
      },
      stats: {
        totalPoints: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        streak: 0,
        lastActiveDate: FieldValue.serverTimestamp(),
        totalTimeSpent: 0
      },
      achievements: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    await adminDb.collection('users').doc(userId).set(userProfile);
    
    console.log('✅ User profile created:', userId, email);

    return json({ 
      success: true, 
      message: 'User profile created successfully',
      userId: userId,
      isAdmin: userProfile.role === 'admin',
      data: userProfile
    });

  } catch (error) {
    console.error('Error creating user profile:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};