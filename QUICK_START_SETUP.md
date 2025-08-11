# 🚀 Quick Start Setup Guide

Since you don't have Firebase Admin SDK set up yet, here's the fastest way to get started:

## Option 1: Browser-Based Setup (Easiest)

### Step 1: Create Your Account
1. Go to your app homepage
2. Sign up with your email and password (or Google sign-in)

### Step 2: Run Auto-Setup
1. Once logged in, visit: **`/setup-admin`**
2. Click "Start Setup" 
3. Wait for all steps to complete
4. Click "Go to Admin Panel"

✅ **Done!** You now have:
- Firebase collections created
- Sample questions added
- Admin access enabled
- Ready to create more questions

---

## Option 2: Firebase Console Method (Manual)

### Step 1: Create Collections in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your "previsely" project
3. Go to "Firestore Database"
4. Click "Start collection" and create these collections:

#### Create `users` collection:
- Collection ID: `users`
- Document ID: `[your-auth-uid]` (get this from Authentication tab)
- Fields:
```json
{
  "email": "your-email@example.com",
  "displayName": "Your Name",
  "role": "admin",
  "createdAt": [current timestamp]
}
```

#### Create `curriculums` collection:
- Collection ID: `curriculums`
- Document ID: Auto-generate
- Fields:
```json
{
  "year": 2024,
  "grade": 5,
  "subject": "math",
  "chapterId": "ch-decimals-01",
  "chapterName": "Introduction to Decimals",
  "isActive": true,
  "level": "beginner"
}
```

#### Create `questions` collection:
- Collection ID: `questions`
- Document ID: Auto-generate
- Fields:
```json
{
  "subject": "math",
  "grade": 5,
  "question": {
    "text": "What is 0.5 as a fraction?"
  },
  "options": {
    "a": {"text": "1/2"},
    "b": {"text": "1/5"},
    "c": {"text": "5/1"},
    "d": {"text": "2/1"}
  },
  "difficulty": "easy",
  "points": 10
}
```

---

## Option 3: Firebase Admin SDK (Production Setup)

For production use, follow these steps:

### Step 1: Get Service Account Key
1. Go to Firebase Console > Project Settings
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file

### Step 2: Set Environment Variables
Create/update your `.env` file:
```env
FIREBASE_ADMIN_PROJECT_ID=previsely
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@previsely.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### Step 3: Run Setup Scripts
```bash
# Install dependencies if needed
npm install firebase-admin

# Run setup
node src/lib/firebase/setup-firestore.js

# Make yourself admin (replace with your email)
node src/lib/firebase/make-admin.js your-email@example.com
```

---

## 🎯 Recommended Quick Start

**For immediate testing:** Use Option 1 (`/setup-admin` page)

**For production:** Use Option 3 (Firebase Admin SDK)

## What Gets Created

After setup, you'll have:

### Collections:
- ✅ `users` - User profiles with roles
- ✅ `curriculums` - Course structure  
- ✅ `questions` - Question bank
- ✅ `achievements` - Gamification badges

### Sample Data:
- ✅ 3 sample math questions about decimals
- ✅ 3 achievement badges
- ✅ 1 curriculum for Grade 5 Math
- ✅ Your user account with admin role

### Admin Access:
- ✅ Access to `/admin` panel
- ✅ Create questions at `/admin/questions/create`
- ✅ Bulk import at `/admin/questions/import`
- ✅ Question management dashboard

## Next Steps After Setup

1. **Test the system**: Try the questions at `/math-mania/exercise`
2. **Create more questions**: Use `/admin/questions/create`
3. **Bulk import**: Use `/admin/questions/import` with CSV
4. **Review security**: Set up proper Firebase Admin SDK for production

## Troubleshooting

### "Admin API not configured"
- Make sure you completed the setup and have admin role
- Try logging out and back in
- Check that your user document exists in Firestore

### "No collections found"  
- Run the setup process first
- Check Firebase Console to see if collections were created
- Make sure you have proper Firebase permissions

### "Permission denied"
- Your user needs the "admin" role in the `users` collection
- Check Firestore security rules are deployed

---

**Ready to start?** Go to `/setup-admin` and click "Start Setup"! 🚀