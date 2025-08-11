#!/usr/bin/env node

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

console.log('🔥 Testing Firebase Admin SDK Connection...\n');

// Check if environment variables are loaded
const requiredVars = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL', 
  'FIREBASE_ADMIN_PRIVATE_KEY'
];

console.log('📋 Checking environment variables:');
let allVarsSet = true;
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    if (varName === 'FIREBASE_ADMIN_PRIVATE_KEY') {
      console.log(`✅ ${varName}: [LOADED - ${value.length} characters]`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allVarsSet = false;
  }
}

if (!allVarsSet) {
  console.log('\n❌ Missing required environment variables. Please check your .env.local file.');
  process.exit(1);
}

try {
  console.log('\n🚀 Initializing Firebase Admin SDK...');

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

  console.log('✅ Firebase Admin initialized successfully');

  // Test Auth
  console.log('\n👤 Testing Firebase Auth...');
  const auth = getAuth(app);
  
  try {
    // List first few users (just to test connection)
    const listUsersResult = await auth.listUsers(5);
    console.log(`✅ Auth connection successful - Found ${listUsersResult.users.length} users`);
    
    if (listUsersResult.users.length > 0) {
      console.log('   Sample user:', listUsersResult.users[0].email || listUsersResult.users[0].uid);
    }
  } catch (error) {
    console.log('❌ Auth test failed:', error.message);
  }

  // Test Firestore
  console.log('\n🗃️  Testing Firestore...');
  const db = getFirestore(app);
  
  try {
    // Try to read collections
    const collections = await db.listCollections();
    console.log(`✅ Firestore connection successful - Found ${collections.length} collections:`);
    
    collections.forEach(collection => {
      console.log(`   - ${collection.id}`);
    });

    // Test writing to Firestore
    console.log('\n📝 Testing Firestore write...');
    const testDoc = await db.collection('admin_test').add({
      message: 'Admin SDK test successful!',
      timestamp: new Date(),
      testId: Math.random().toString(36).substring(7)
    });
    
    console.log('✅ Firestore write successful, document ID:', testDoc.id);

    // Clean up test document
    await testDoc.delete();
    console.log('✅ Test document cleaned up');

  } catch (error) {
    console.log('❌ Firestore test failed:', error.message);
  }

  console.log('\n🎉 Firebase Admin SDK is properly configured and working!');
  console.log('\nNext steps:');
  console.log('- Your APIs can now securely validate answers server-side');
  console.log('- Question answers will be properly hashed and secured');
  console.log('- User management will work with proper authentication');

} catch (error) {
  console.error('\n❌ Firebase Admin SDK test failed:');
  console.error('Error:', error.message);
  
  if (error.message.includes('private_key')) {
    console.error('\n💡 Tip: Check your FIREBASE_ADMIN_PRIVATE_KEY format in .env.local');
    console.error('   Make sure it includes the full key with proper line breaks');
  } else if (error.message.includes('client_email')) {
    console.error('\n💡 Tip: Check your FIREBASE_ADMIN_CLIENT_EMAIL in .env.local');
    console.error('   It should be: firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com');
  } else if (error.message.includes('project')) {
    console.error('\n💡 Tip: Check your FIREBASE_ADMIN_PROJECT_ID matches your Firebase project');
  }
  
  process.exit(1);
}