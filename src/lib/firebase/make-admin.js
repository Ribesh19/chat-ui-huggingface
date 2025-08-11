// Make Admin Script
// Run this with: node src/lib/firebase/make-admin.js your-email@example.com

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

async function makeUserAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ User found:', userRecord.uid);
    
    // Check if user document exists in Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      console.log('📝 User document doesn\'t exist. Creating one...');
      
      // Create user profile
      const userProfile = {
        email: userRecord.email,
        displayName: userRecord.displayName || 'Admin User',
        photoURL: userRecord.photoURL || null,
        role: 'admin',
        profile: {
          grade: 12, // Admin can access all grades
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
      console.log('✅ Created new admin user profile');
      
    } else {
      console.log('📝 User document exists. Updating role to admin...');
      
      // Update existing user to admin
      await db.collection('users').doc(userRecord.uid).update({
        role: 'admin',
        'subscription.plan': 'enterprise',
        'subscription.features': ['all_features', 'admin_access', 'unlimited_questions'],
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log('✅ Updated user role to admin');
    }
    
    // Set custom claims for additional security
    await auth.setCustomUserClaims(userRecord.uid, { 
      admin: true,
      role: 'admin'
    });
    console.log('✅ Set custom claims for enhanced security');
    
    console.log('\n🎉 Success! User is now an admin.');
    console.log('\nNext steps:');
    console.log('1. The user should log out and log back in');
    console.log('2. Visit /admin to access the admin panel');
    console.log('3. Start creating questions at /admin/questions/create');
    
  } catch (error) {
    console.error('❌ Error making user admin:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 Tip: Make sure the user has signed up first by:');
      console.log('1. Going to your app and signing up with this email');
      console.log('2. Then run this script again');
    }
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node src/lib/firebase/make-admin.js your-email@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.log('❌ Please provide a valid email address');
  process.exit(1);
}

makeUserAdmin(email);