#!/usr/bin/env node

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'crypto';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

console.log('🏗️  Setting up production-ready data...\n');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
};

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
    })
  : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

// Secure answer hashing
function hashAnswer(answer) {
  return createHash('sha256')
    .update(answer.toLowerCase().trim())
    .digest('hex');
}

async function setupProductionData() {
  try {
    console.log('📚 Creating production curriculum...');
    
    // Create comprehensive curriculum
    const curriculum = {
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

    const curriculumRef = await db.collection('curriculums').add(curriculum);
    console.log('✅ Curriculum created:', curriculumRef.id);

    console.log('❓ Creating production questions with secure answers...');
    
    // Production-ready questions with proper security
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
        correctAnswerHash: hashAnswer('b'),
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
      },
      {
        curriculumId: curriculumRef.id,
        year: 2024,
        grade: 5,
        subject: 'math',
        chapterId: 'ch-decimals-comprehensive',
        type: 'multiple-choice',
        question: {
          text: 'Round 4.567 to the nearest hundredth.',
          imageUrl: null,
          audioUrl: null,
          latex: null
        },
        options: {
          a: { text: '4.57', imageUrl: null },
          b: { text: '4.56', imageUrl: null },
          c: { text: '4.6', imageUrl: null },
          d: { text: '5.0', imageUrl: null }
        },
        correctAnswerHash: hashAnswer('a'),
        explanation: 'To round to the nearest hundredth, look at the thousandths place. Since 7 ≥ 5, we round the hundredths place up from 6 to 7, giving us 4.57.',
        hints: [
          'Look at the digit in the thousandths place (third digit after decimal)',
          'If the digit is 5 or greater, round up',
          'The hundredths place is the second digit after the decimal point'
        ],
        difficulty: 'medium',
        points: 15,
        tags: ['decimals', 'rounding', 'hundredths'],
        estimatedTime: 90,
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
          text: 'Which decimal is the largest?',
          imageUrl: null,
          audioUrl: null,
          latex: null
        },
        options: {
          a: { text: '0.8', imageUrl: null },
          b: { text: '0.75', imageUrl: null },
          c: { text: '0.9', imageUrl: null },
          d: { text: '0.65', imageUrl: null }
        },
        correctAnswerHash: hashAnswer('c'),
        explanation: 'When comparing decimals, compare digit by digit from left to right. 0.9 has 9 in the tenths place, which is larger than 8, 7, or 6 in the tenths place of the other options.',
        hints: [
          'Compare the tenths place first (first digit after decimal)',
          'Line up the decimal points when comparing',
          '0.9 is the same as 0.90, which helps in comparison'
        ],
        difficulty: 'medium',
        points: 15,
        tags: ['decimals', 'comparison', 'ordering'],
        estimatedTime: 75,
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
          text: 'What is 3/4 expressed as a decimal?',
          imageUrl: null,
          audioUrl: null,
          latex: null
        },
        options: {
          a: { text: '0.75', imageUrl: null },
          b: { text: '0.34', imageUrl: null },
          c: { text: '3.4', imageUrl: null },
          d: { text: '0.43', imageUrl: null }
        },
        correctAnswerHash: hashAnswer('a'),
        explanation: 'To convert 3/4 to a decimal, divide 3 by 4. 3 ÷ 4 = 0.75. You can also think of 3/4 as 75/100, which equals 0.75.',
        hints: [
          'Divide the numerator by the denominator: 3 ÷ 4',
          'Think of equivalent fractions: 3/4 = ?/100',
          '3/4 means 3 out of 4 equal parts'
        ],
        difficulty: 'medium',
        points: 20,
        tags: ['decimals', 'fractions', 'conversion'],
        estimatedTime: 120,
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
      const questionRef = await db.collection('questions').add(questions[i]);
      console.log(`✅ Question ${i + 1} created:`, questionRef.id);
    }

    console.log('\n🏆 Creating achievement system...');
    
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
      },
      {
        name: 'Speed Demon',
        description: 'Answer 5 questions in under 30 seconds each',
        iconUrl: '/achievements/speed-demon.svg',
        category: 'speed',
        criteria: {
          type: 'fast_answers',
          value: 5,
          maxTime: 30
        },
        points: 150,
        rarity: 'epic',
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Math Perfectionist',
        description: 'Get 10 questions correct in a row',
        iconUrl: '/achievements/perfectionist.svg',
        category: 'streak',
        criteria: {
          type: 'streak',
          value: 10
        },
        points: 200,
        rarity: 'epic',
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Decimal Master',
        description: 'Complete all decimal exercises with 90% accuracy',
        iconUrl: '/achievements/decimal-master.svg',
        category: 'mastery',
        criteria: {
          type: 'subject_mastery',
          value: 90,
          subject: 'math',
          topic: 'decimals'
        },
        points: 500,
        rarity: 'legendary',
        createdAt: FieldValue.serverTimestamp()
      }
    ];

    for (let i = 0; i < achievements.length; i++) {
      const achievementRef = await db.collection('achievements').add(achievements[i]);
      console.log(`✅ Achievement "${achievements[i].name}" created:`, achievementRef.id);
    }

    console.log('\n🎉 Production data setup complete!');
    console.log('\nCreated:');
    console.log(`- 1 comprehensive curriculum`);
    console.log(`- ${questions.length} production-ready questions with secure answers`);
    console.log(`- ${achievements.length} achievement badges`);
    console.log('\nAll answers are securely hashed using SHA-256!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

async function makeUserAdmin(email) {
  if (!email) {
    console.log('💡 Usage: node scripts/setup-production-data.js <admin-email>');
    return;
  }

  try {
    console.log(`\n👤 Making ${email} an admin...`);
    
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ User found:', userRecord.uid);
    
    const userProfile = {
      email: userRecord.email,
      displayName: userRecord.displayName || 'Admin User',
      photoURL: userRecord.photoURL || null,
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
    
    await db.collection('users').doc(userRecord.uid).set(userProfile);
    console.log('✅ Admin user profile created');
    
    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { 
      admin: true,
      role: 'admin'
    });
    console.log('✅ Admin claims set');
    
  } catch (error) {
    console.error('❌ Failed to make user admin:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const adminEmail = process.argv[2];
  
  try {
    await setupProductionData();
    
    if (adminEmail) {
      await makeUserAdmin(adminEmail);
    } else {
      console.log('\n💡 To make a user admin, run:');
      console.log('node scripts/setup-production-data.js your-email@example.com');
    }
    
    console.log('\n🚀 Ready for production! Your secure question system is live.');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();