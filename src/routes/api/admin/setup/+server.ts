import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken, hashAnswer } from '$lib/firebase/admin';
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
    const displayName = decodedToken.name || 'Admin User';

    // Only allow setup for the specific admin email
    if (email !== 'ribeshforu@gmail.com') {
      return json({ 
        success: false, 
        error: 'Access denied - Only authorized admin can run setup' 
      }, { status: 403 });
    }

    console.log('🔧 Starting admin setup for:', email);

    // Check if setup already exists
    const existingUser = await adminDb.collection('users').doc(userId).get();
    const curriculumQuery = await adminDb.collection('curriculums').limit(1).get();
    
    if (existingUser.exists && existingUser.data()?.role === 'admin' && !curriculumQuery.empty) {
      return json({ 
        success: true, 
        message: 'Setup already completed',
        isAdmin: true,
        alreadySetup: true
      });
    }

    // Create curriculum
    console.log('📚 Creating comprehensive curriculum...');
    const curriculumData = {
      year: 2024,
      grade: 5,
      subject: 'math',
      chapterId: 'ch-decimals-comprehensive',
      chapterName: 'Comprehensive Decimals',
      curriculumDetails: {
        topics: [
          'Understanding place value',
          'Reading and writing decimals',
          'Comparing and ordering decimals',
          'Rounding decimals',
          'Adding and subtracting decimals',
          'Converting between fractions and decimals'
        ],
        learningObjectives: [
          'Identify decimal place values to thousandths',
          'Compare and order decimal numbers',
          'Round decimals to various places',
          'Perform operations with decimals',
          'Convert between decimal and fraction forms'
        ],
        prerequisites: ['Whole numbers', 'Basic fractions', 'Place value concepts'],
        estimatedHours: 12,
        orderIndex: 1
      },
      level: 'beginner',
      isActive: true,
      metadata: {
        region: 'US',
        board: 'Common Core',
        language: 'en',
        author: 'Admin Setup',
        version: '1.0'
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const curriculumRef = await adminDb.collection('curriculums').add(curriculumData);
    console.log('✅ Curriculum created:', curriculumRef.id);

    // Create secure questions with proper SHA-256 hashing
    console.log('❓ Creating secure questions...');
    const questions = [
      {
        curriculumId: curriculumRef.id,
        year: 2024,
        grade: 5,
        subject: 'math',
        chapterId: 'ch-decimals-comprehensive',
        type: 'multiple-choice',
        question: {
          text: 'What is the value of the digit 7 in the decimal number 3.472?',
          imageUrl: null,
          audioUrl: null,
          latex: null
        },
        options: {
          a: { text: '7 tenths', imageUrl: null },
          b: { text: '7 hundredths', imageUrl: null },
          c: { text: '7 thousandths', imageUrl: null },
          d: { text: '7 ones', imageUrl: null }
        },
        correctAnswerHash: hashAnswer('b'), // Properly hashed with SHA-256
        explanation: 'The digit 7 is in the hundredths place, which is the second position after the decimal point. Therefore, 7 represents 7 hundredths.',
        hints: [
          'Count the positions after the decimal point from left to right',
          'The first position after the decimal is tenths, the second is hundredths',
          'Look at which column the digit 7 is in'
        ],
        difficulty: 'easy',
        points: 10,
        tags: ['decimals', 'place-value', 'identification'],
        estimatedTime: 45,
        statistics: {
          attemptCount: 0,
          correctCount: 0,
          averageTime: 0
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      {
        curriculumId: curriculumRef.id,
        year: 2024,
        grade: 5,
        subject: 'math',
        chapterId: 'ch-decimals-comprehensive',
        type: 'multiple-choice',
        question: {
          text: 'Which decimal is equivalent to 0.5?',
          imageUrl: null,
          audioUrl: null,
          latex: null
        },
        options: {
          a: { text: '0.50', imageUrl: null },
          b: { text: '0.05', imageUrl: null },
          c: { text: '5.0', imageUrl: null },
          d: { text: '0.500', imageUrl: null }
        },
        correctAnswerHash: hashAnswer('a'),
        explanation: '0.5, 0.50, and 0.500 are all equivalent because adding zeros at the end of a decimal does not change its value. 0.50 is the most common way to express this.',
        hints: [
          'Adding zeros after the last digit in a decimal doesn\'t change the value',
          'Think about what each place value represents',
          'Both 0.5 and 0.50 represent five tenths'
        ],
        difficulty: 'easy',
        points: 10,
        tags: ['decimals', 'equivalent', 'zeros'],
        estimatedTime: 60,
        statistics: {
          attemptCount: 0,
          correctCount: 0,
          averageTime: 0
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }
    ];

    for (let i = 0; i < questions.length; i++) {
      const questionRef = await adminDb.collection('questions').add(questions[i]);
      console.log(`✅ Question ${i + 1} created:`, questionRef.id);
    }

    // Create achievements
    console.log('🏆 Creating achievement system...');
    const achievements = [
      {
        name: 'First Steps',
        description: 'Answer your first question correctly',
        iconUrl: '/achievements/first-steps.svg',
        category: 'special',
        criteria: {
          type: 'correct_answers',
          value: 1
        },
        points: 50,
        rarity: 'common',
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Decimal Detective',
        description: 'Correctly identify 5 decimal place values',
        iconUrl: '/achievements/decimal-detective.svg',
        category: 'mastery',
        criteria: {
          type: 'tagged_correct_answers',
          value: 5,
          tag: 'place-value'
        },
        points: 100,
        rarity: 'rare',
        createdAt: FieldValue.serverTimestamp()
      }
    ];

    for (let i = 0; i < achievements.length; i++) {
      const achievementRef = await adminDb.collection('achievements').add(achievements[i]);
      console.log(`✅ Achievement "${achievements[i].name}" created:`, achievementRef.id);
    }

    // Create/update admin user profile
    console.log('👤 Creating admin user profile...');
    const userProfile = {
      email: email,
      displayName: displayName,
      photoURL: decodedToken.picture || null,
      role: 'admin',
      profile: {
        grade: 12,
        age: null,
        school: null,
        preferredSubjects: ['math', 'science', 'english'],
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
        plan: 'enterprise',
        startDate: FieldValue.serverTimestamp(),
        endDate: FieldValue.serverTimestamp(),
        features: ['all_features', 'admin_access', 'unlimited_questions']
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
    console.log('✅ Admin user profile created');

    console.log('🎉 Setup completed successfully!');
    
    return json({ 
      success: true, 
      message: 'Setup completed successfully! Collections created and admin access granted.',
      isAdmin: true,
      stats: {
        curriculumCreated: 1,
        questionsCreated: questions.length,
        achievementsCreated: achievements.length
      }
    });

  } catch (error) {
    console.error('Error during setup:', error);
    return json({ 
      success: false, 
      error: 'Internal server error during setup' 
    }, { status: 500 });
  }
};