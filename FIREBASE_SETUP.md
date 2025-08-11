# Firebase Setup Guide for AI Tutoring Platform

## Overview
This guide will help you set up Firebase for the AI tutoring platform with proper security and data structure.

## Prerequisites
- Firebase project created at [Firebase Console](https://console.firebase.google.com)
- Node.js and npm installed
- Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Firebase Configuration

### 1.1 Enable Required Services
In Firebase Console, enable:
- **Authentication** (Email/Password, Google Sign-in)
- **Firestore Database**
- **Storage**
- **Analytics** (optional)

### 1.2 Get Firebase Admin SDK Credentials
1. Go to Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely
4. Add the credentials to your `.env` file:

```env
FIREBASE_ADMIN_PROJECT_ID=previsely
FIREBASE_ADMIN_CLIENT_EMAIL=<from-json-file>
FIREBASE_ADMIN_PRIVATE_KEY=<from-json-file>
```

## Step 2: Deploy Firestore Security Rules

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select Firestore and configure

# Deploy rules
firebase deploy --only firestore:rules
```

## Step 3: Create Initial Collections

Run this script to create initial collections with proper indexes:

```javascript
// setup-firestore.js
import { adminDb } from './src/lib/firebase/admin.js';

async function setupCollections() {
  // Create composite indexes
  const indexes = [
    {
      collection: 'questions',
      fields: [
        { field: 'curriculumId', order: 'ASCENDING' },
        { field: 'difficulty', order: 'ASCENDING' },
        { field: 'subject', order: 'ASCENDING' }
      ]
    },
    {
      collection: 'user_progress',
      fields: [
        { field: 'userId', order: 'ASCENDING' },
        { field: 'curriculumId', order: 'ASCENDING' },
        { field: 'status', order: 'ASCENDING' }
      ]
    },
    {
      collection: 'learning_sessions',
      fields: [
        { field: 'userId', order: 'ASCENDING' },
        { field: 'status', order: 'ASCENDING' },
        { field: 'createdAt', order: 'DESCENDING' }
      ]
    }
  ];

  console.log('Indexes need to be created manually in Firebase Console');
  console.log('Go to Firestore > Indexes and create these composite indexes:');
  indexes.forEach(index => {
    console.log(`\nCollection: ${index.collection}`);
    console.log('Fields:', index.fields);
  });
}

setupCollections();
```

## Step 4: Sample Data Seeding

Create sample curriculums and questions:

```javascript
// seed-data.js
import { adminDb, hashAnswer } from './src/lib/firebase/admin.js';
import { FieldValue } from 'firebase-admin/firestore';

async function seedData() {
  // Sample Curriculum
  const curriculum = {
    year: 2024,
    grade: 5,
    subject: 'math',
    chapterId: 'ch-decimals-01',
    chapterName: 'Introduction to Decimals',
    curriculumDetails: {
      topics: ['Place value', 'Reading decimals', 'Writing decimals'],
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
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  const curriculumRef = await adminDb.collection('curriculums').add(curriculum);
  console.log('Created curriculum:', curriculumRef.id);

  // Sample Question
  const question = {
    curriculumId: curriculumRef.id,
    year: 2024,
    grade: 5,
    subject: 'math',
    chapterId: 'ch-decimals-01',
    type: 'multiple-choice',
    question: {
      text: 'What is the value of the digit 7 in 3.472?',
      imageUrl: null,
      audioUrl: null,
      latex: null
    },
    options: {
      a: { text: '7 tenths' },
      b: { text: '7 hundredths' },
      c: { text: '7 thousandths' },
      d: { text: '7 ones' }
    },
    correctAnswerHash: hashAnswer('b'),
    explanation: 'The digit 7 is in the hundredths place (second digit after decimal point).',
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
  };

  const questionRef = await adminDb.collection('questions').add(question);
  console.log('Created question:', questionRef.id);
}

seedData();
```

## Step 5: Testing the Setup

### 5.1 Test Authentication
```javascript
// In your Svelte component
import { auth } from '$lib/firebase/client';
import { signInWithEmailAndPassword } from 'firebase/auth';

const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Logged in:', userCredential.user.uid);
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

### 5.2 Test Answer Validation
```javascript
// Call the validation API
const validateAnswer = async (questionId, answer) => {
  const token = await auth.currentUser?.getIdToken();
  
  const response = await fetch('/api/quiz/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      questionId,
      userAnswer: answer,
      timeSpent: 45,
      hintsUsed: 0
    })
  });
  
  const result = await response.json();
  console.log('Validation result:', result);
};
```

## Step 6: Monitoring and Maintenance

### 6.1 Set Up Monitoring
- Enable Firebase Performance Monitoring
- Set up Cloud Functions for automated tasks
- Configure budget alerts in Google Cloud Console

### 6.2 Regular Maintenance
- Review Firestore usage and optimize queries
- Monitor security rules effectiveness
- Update indexes based on query patterns
- Regular backups using Firebase Admin SDK

## Security Best Practices

1. **Never expose answers in client code**
   - All answer validation happens server-side
   - Use hashed answers in database

2. **Implement rate limiting**
   - Add rate limiting to API endpoints
   - Monitor for suspicious activity

3. **Regular security audits**
   - Review Firebase Security Rules
   - Check for exposed credentials
   - Monitor authentication patterns

4. **Data encryption**
   - Enable encryption at rest in Firestore
   - Use HTTPS for all communications

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check Firebase Security Rules
   - Verify authentication status
   - Check user roles

2. **Slow Queries**
   - Create appropriate indexes
   - Limit query results
   - Use pagination

3. **Authentication Issues**
   - Verify Firebase configuration
   - Check token expiration
   - Review CORS settings

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)