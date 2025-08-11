// Firebase Setup Script
// Run this with: node src/lib/firebase/setup-firestore.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'crypto';

// You'll need to replace these with your actual Firebase credentials
const serviceAccount = {
  projectId: "previsely",
  clientEmail: "your-service-account-email@previsely.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
};

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'previsely.firebasestorage.app'
});

const auth = getAuth(app);
const db = getFirestore(app);

// Hash function for answers
function hashAnswer(answer) {
  return createHash('sha256').update(answer.toLowerCase().trim()).digest('hex');
}

async function setupFirestore() {
  try {
    console.log('🔥 Setting up Firestore collections...\n');

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
          'Compare and order decimals',
          'Round decimals to various places'
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const curriculumRef = await db.collection('curriculums').add(curriculumData);
    console.log('✅ Curriculum created with ID:', curriculumRef.id);

    // 2. Create sample questions
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
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      {
        curriculumId: curriculumRef.id,
        year: 2024,
        grade: 5,
        subject: 'math',
        chapterId: 'ch-decimals-01',
        type: 'multiple-choice',
        question: {
          text: 'Which decimal is equal to 0.5?'
        },
        options: {
          a: { text: '0.50' },
          b: { text: '0.05' },
          c: { text: '5.0' },
          d: { text: '0.500' }
        },
        correctAnswerHash: hashAnswer('a'), // Both a and d are correct, but a is the primary answer
        explanation: '0.5 = 0.50 = 0.500. Adding zeros after the last digit doesn\'t change the value.',
        hints: [
          'Adding zeros after the decimal doesn\'t change the value',
          'Think about what each place value represents'
        ],
        difficulty: 'easy',
        points: 10,
        tags: ['decimals', 'equivalent'],
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
        chapterId: 'ch-decimals-01',
        type: 'multiple-choice',
        question: {
          text: 'Round 4.567 to the nearest hundredth.'
        },
        options: {
          a: { text: '4.57' },
          b: { text: '4.56' },
          c: { text: '4.6' },
          d: { text: '5' }
        },
        correctAnswerHash: hashAnswer('a'),
        explanation: 'Look at the thousandths place (7). Since 7 ≥ 5, round the hundredths place up from 6 to 7.',
        hints: [
          'Look at the digit in the thousandths place',
          'If the digit is 5 or greater, round up'
        ],
        difficulty: 'medium',
        points: 15,
        tags: ['decimals', 'rounding'],
        estimatedTime: 90,
        statistics: {
          attemptCount: 0,
          correctCount: 0,
          averageTime: 0
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }
    ];

    for (const question of questions) {
      const questionRef = await db.collection('questions').add(question);
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
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Math Whiz',
        description: 'Answer 10 math questions correctly',
        iconUrl: '/icons/math-whiz.png',
        category: 'mastery',
        criteria: {
          type: 'correct_answers',
          value: 10,
          subject: 'math'
        },
        points: 100,
        rarity: 'rare',
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Speed Demon',
        description: 'Answer 5 questions in under 30 seconds each',
        iconUrl: '/icons/speed-demon.png',
        category: 'speed',
        criteria: {
          type: 'fast_answers',
          value: 5
        },
        points: 200,
        rarity: 'epic',
        createdAt: FieldValue.serverTimestamp()
      }
    ];

    for (const achievement of achievements) {
      const achievementRef = await db.collection('achievements').add(achievement);
      console.log('✅ Achievement created with ID:', achievementRef.id);
    }

    console.log('\n🎉 Firestore setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Sign up/login to your app to create a user account');
    console.log('2. Run the make-admin script with your email to become an admin');
    console.log('3. Access /admin to start creating questions');

  } catch (error) {
    console.error('❌ Error setting up Firestore:', error);
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupFirestore();
}

export { setupFirestore };