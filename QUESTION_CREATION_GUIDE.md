# Question Creation Guide

## 🎯 How to Start Creating Questions

You now have a complete question creation system with multiple ways to add questions to your AI tutoring platform.

### 1. **Admin Access Setup**

First, you need to set up admin access:

#### Create an Admin User:
1. Go to your Firebase Console
2. Navigate to Authentication > Users
3. Find your user account
4. In Firestore, go to the `users` collection
5. Update your user document to set `role: "admin"`

Or programmatically:
```javascript
// In Firebase Console > Firestore > users > [your-user-id]
{
  "role": "admin",
  // ... other user fields
}
```

### 2. **Access the Admin Panel**

Once you have admin access:
1. Navigate to `/admin` in your application
2. You'll see the admin dashboard with navigation to different sections
3. Click on "Questions" to manage your question bank

### 3. **Three Ways to Create Questions**

#### Method 1: Individual Question Creation
- **URL**: `/admin/questions/create`
- **Best for**: Creating single, detailed questions
- **Features**:
  - Form-based question creation
  - Real-time preview
  - Rich question options (images, LaTeX, hints)
  - Validation and error handling

#### Method 2: Bulk Import via CSV
- **URL**: `/admin/questions/import`
- **Best for**: Adding many questions at once
- **Features**:
  - Download CSV template
  - Drag & drop file upload
  - Batch processing with error reporting
  - Support for all question fields

#### Method 3: API-Based Creation
- **Endpoint**: `POST /api/admin/questions`
- **Best for**: Programmatic question creation
- **Authentication**: Requires Bearer token from admin user

### 4. **Question Structure**

Each question includes:
- **Basic Info**: Subject, grade, curriculum, difficulty
- **Question Content**: Text, optional images/LaTeX
- **Answer Options**: 4-5 multiple choice options
- **Correct Answer**: Securely hashed server-side
- **Educational**: Explanation, hints, tags
- **Metadata**: Points, estimated time, statistics

### 5. **CSV Import Format**

For bulk import, use this CSV format:

```csv
subject,grade,chapter_id,question_text,option_a,option_b,option_c,option_d,option_e,correct_answer,difficulty,points,explanation,hints,tags,estimated_time
math,5,ch-decimals-01,"What is the value of the digit 7 in 3.472?","7 tenths","7 hundredths","7 thousandths","7 ones",,b,easy,10,"The digit 7 is in the hundredths place.","Count positions after decimal|Second position is hundredths","decimals|place-value",60
```

**Key CSV Tips**:
- Use pipe (`|`) to separate multiple hints or tags
- Leave `option_e` empty if not needed
- Correct answer should be `a`, `b`, `c`, `d`, or `e`
- Difficulty: `easy`, `medium`, `hard`, `expert`

### 6. **Quick Start Steps**

1. **Set up admin access** (update your user role to "admin")
2. **Create your first curriculum** (or use existing)
3. **Start with individual creation**:
   - Go to `/admin/questions/create`
   - Fill in a simple math question
   - Preview and submit
4. **Scale with CSV import**:
   - Download the template from `/admin/questions/import`
   - Add multiple questions
   - Upload and process

### 7. **Sample Questions to Get Started**

Here are some example questions you can use:

```csv
subject,grade,chapter_id,question_text,option_a,option_b,option_c,option_d,option_e,correct_answer,difficulty,points,explanation,hints,tags,estimated_time
math,5,ch-decimals-01,"What is 0.5 as a fraction?","1/2","1/5","5/1","2/1",,a,easy,10,"0.5 means 5 tenths which equals 1/2","Convert decimal to fraction|0.5 = 5/10 = 1/2","decimals|fractions",45
math,5,ch-decimals-01,"Which decimal is largest?","0.8","0.08","0.80","0.800",,a,easy,10,"0.8 and 0.80 and 0.800 are equal, but 0.08 is smaller","Compare digit by digit|0.8 = 0.80 = 0.800","decimals|comparison",60
math,5,ch-addition-01,"What is 245 + 167?","412","312","422","402",,a,medium,15,"245 + 167: 5+7=12 (write 2 carry 1), 4+6+1=11 (write 1 carry 1), 2+1+1=4","Add column by column|Don't forget to carry","addition|multi-digit",90
```

### 8. **Question Management Features**

The admin system includes:
- **Question List**: View all questions with filtering
- **Search**: Find questions by text or tags
- **Statistics**: View attempt counts and success rates
- **Edit/Delete**: Modify or remove questions
- **Preview**: See how questions appear to students

### 9. **Security Features**

Your question system is secure:
- ✅ **Answers hidden**: Never sent to client-side
- ✅ **Server validation**: All answer checking server-side
- ✅ **Hashed storage**: Answers stored as SHA-256 hashes
- ✅ **Admin only**: Question creation restricted to admins
- ✅ **Token auth**: API endpoints protected with Firebase auth

### 10. **Next Steps**

After creating questions:
1. **Test them**: Use the math exercise page to try your questions
2. **Create curriculums**: Organize questions into learning paths
3. **Monitor performance**: Check question statistics and success rates
4. **Iterate**: Update questions based on student performance
5. **Scale**: Use CSV import to add hundreds of questions quickly

### 🚀 Ready to Start!

You can now:
1. Access `/admin` (as an admin user)
2. Create your first question at `/admin/questions/create`
3. Or bulk import questions at `/admin/questions/import`
4. View and manage questions at `/admin/questions`

The system is production-ready with secure answer handling, comprehensive analytics, and a user-friendly interface for both creation and management!