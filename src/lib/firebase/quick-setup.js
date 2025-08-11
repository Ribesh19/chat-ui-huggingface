// Quick Setup Script - No Firebase Admin SDK needed
// This creates the collections directly through the web SDK
// Run this by visiting: /setup-admin in your browser (we'll create this page)

import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  serverTimestamp,
  getFirestore
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase.js';

// Hash function (client-side version - not as secure as server-side)
function hashAnswer(answer) {
  // Simple hash for demo - in production use server-side hashing
  return btoa(answer.toLowerCase().trim());
}

export async function quickSetupCollections() {
  try {
    console.log('🔥 Setting up Firestore collections...');
    
    const db = getFirestore(app);

    // 1. Create a sample curriculum
    console.log('📚 Creating sample curriculum...');
    const curriculumData = {
      year: 2024,
      grade: 5,
      subject: 'math',
      chapterId: 'ch-decimals-01',
      chapterName: 'Introduction to Decimals',
      curriculumDetails: {
        topics: ['Place value', 'Reading decimals', 'Writing decimals', 'Comparing decimals'],
        learningObjectives: [
          'Understand decimal place value',
          'Read and write decimals to thousandths',
          'Compare and order decimals'
        ],
        prerequisites: ['Whole numbers', 'Fractions basics'],
        estimatedHours: 8,
        orderIndex: 1
      },
      level: 'beginner',
      isActive: true,
      metadata: {
        region: 'US',
        board: 'Common Core',
        language: 'en'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const curriculumRef = await addDoc(collection(db, 'curriculums'), curriculumData);
    console.log('✅ Curriculum created with ID:', curriculumRef.id);

    // 2. Create sample questions (without proper answer hashing for now)
    console.log('❓ Creating sample questions...');
    const questions = [
      {
        curriculumId: curriculumRef.id,
        year: 2024,
        grade: 5,
        subject: 'math',
        chapterId: 'ch-decimals-01',
        type: 'multiple-choice',
        question: {
          text: 'What is the value of the digit 7 in 3.472?'
        },
        options: {
          a: { text: '7 tenths' },
          b: { text: '7 hundredths' },
          c: { text: '7 thousandths' },
          d: { text: '7 ones' }
        },
        // Note: This is not secure - answers should be hashed server-side
        correctAnswerHash: hashAnswer('b'),
        explanation: 'The digit 7 is in the hundredths place (second digit after the decimal point).',
        hints: [
          'Count the positions after the decimal point',
          'First position is tenths, second is hundredths'
        ],
        difficulty: 'easy',
        points: 10,
        tags: ['decimals', 'place-value'],
        estimatedTime: 60,
        statistics: {
          attemptCount: 0,
          correctCount: 0,
          averageTime: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const question of questions) {
      const questionRef = await addDoc(collection(db, 'questions'), question);
      console.log('✅ Question created with ID:', questionRef.id);
    }

    // 3. Create achievements
    console.log('🏆 Creating sample achievements...');
    const achievements = [
      {
        name: 'First Steps',
        description: 'Answer your first question correctly',
        iconUrl: '/icons/first-steps.png',
        category: 'special',
        criteria: {
          type: 'correct_answers',
          value: 1
        },
        points: 50,
        rarity: 'common',
        createdAt: serverTimestamp()
      }
    ];

    for (const achievement of achievements) {
      const achievementRef = await addDoc(collection(db, 'achievements'), achievement);
      console.log('✅ Achievement created with ID:', achievementRef.id);
    }

    return true;
  } catch (error) {
    console.error('❌ Error setting up Firestore:', error);
    return false;
  }
}

export async function makeCurrentUserAdmin() {
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently logged in');
    }

    console.log('👤 Making user admin:', user.email);
    
    const db = getFirestore(app);

    // Create/update user profile with admin role
    const userProfile = {
      email: user.email,
      displayName: user.displayName || 'Admin User',
      photoURL: user.photoURL || null,
      role: 'admin',
      profile: {
        grade: 12,
        preferredSubjects: ['math', 'science', 'english'],
        learningStyle: 'visual',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en'
      },
      settings: {
        notifications: true,
        darkMode: false,
        fontSize: 'medium',
        soundEffects: true
      },
      subscription: {
        plan: 'enterprise',
        startDate: serverTimestamp(),
        endDate: serverTimestamp(),
        features: ['all_features', 'admin_access', 'unlimited_questions']
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

    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('✅ User profile created with admin role');

    return true;
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    return false;
  }
}