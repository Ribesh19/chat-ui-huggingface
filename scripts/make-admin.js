#!/usr/bin/env node

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

console.log('👤 Making user admin via Firestore...\n');

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

const db = getFirestore(app);

async function makeUserAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Check if user already exists in Firestore users collection
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      // User exists, update their role
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('✅ Found existing user:', userDoc.id);
      console.log('Current role:', userData.role || 'none');
      
      await db.collection('users').doc(userDoc.id).update({
        role: 'admin',
        'subscription.plan': 'enterprise',
        'subscription.features': ['all_features', 'admin_access', 'unlimited_questions'],
        updatedAt: FieldValue.serverTimestamp()
      });
      
      console.log('✅ User updated to admin successfully!');
      console.log('User ID:', userDoc.id);
      
    } else {
      console.log('❌ User not found in Firestore users collection');
      console.log('💡 The user needs to complete the registration process first');
      console.log('   Please make sure you have:');
      console.log('   1. Logged in via Firebase Auth (/auth page)');
      console.log('   2. Completed any profile setup');
      console.log('   3. Waited for the user document to be created');
      
      // Let's check what users exist
      console.log('\n📋 Current users in database:');
      const allUsersSnapshot = await db.collection('users').limit(5).get();
      
      if (allUsersSnapshot.empty) {
        console.log('   No users found in Firestore');
        console.log('   💡 Try visiting a page that creates user profiles after login');
      } else {
        allUsersSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`   - ${doc.id}: ${data.email || 'no email'} (${data.role || 'no role'})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error making user admin:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const email = 'ribeshforu@gmail.com';
  
  try {
    await makeUserAdmin(email);
    console.log('\n🎉 Admin setup process completed!');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();