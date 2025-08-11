import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, hashAnswer, verifyIdToken } from '$lib/firebase/admin';
import { COLLECTIONS } from '$lib/firebase/types';
import type { Question } from '$lib/firebase/types';
import { FieldValue } from 'firebase-admin/firestore';

// GET - Fetch questions (admin only)
export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Check if user is admin
    const userDoc = await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return json({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }, { status: 403 });
    }

    // Get query parameters for filtering
    const grade = url.searchParams.get('grade');
    const subject = url.searchParams.get('subject');
    const difficulty = url.searchParams.get('difficulty');
    const curriculumId = url.searchParams.get('curriculum');

    // Build query
    let query = adminDb.collection(COLLECTIONS.QUESTIONS);

    if (grade) query = query.where('grade', '==', parseInt(grade));
    if (subject) query = query.where('subject', '==', subject);
    if (difficulty) query = query.where('difficulty', '==', difficulty);
    if (curriculumId) query = query.where('curriculumId', '==', curriculumId);

    // Execute query
    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const questions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        curriculumId: data.curriculumId,
        year: data.year,
        grade: data.grade,
        subject: data.subject,
        chapterId: data.chapterId,
        type: data.type,
        question: data.question,
        options: data.options,
        explanation: data.explanation,
        hints: data.hints || [],
        difficulty: data.difficulty,
        points: data.points,
        tags: data.tags || [],
        estimatedTime: data.estimatedTime,
        statistics: data.statistics || { attemptCount: 0, correctCount: 0, averageTime: 0 },
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      };
    });

    return json({
      success: true,
      questions,
      count: questions.length
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// POST - Create a new question (admin only)
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    
    // Verify the user's ID token and check admin role
    const decodedToken = await verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Check if user is admin
    const userDoc = await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return json({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }, { status: 403 });
    }

    // Get question data from request
    const questionData = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'curriculumId', 'year', 'grade', 'subject', 
      'chapterId', 'type', 'question', 'options', 
      'correctAnswer', 'difficulty'
    ];
    
    for (const field of requiredFields) {
      if (!questionData[field]) {
        return json({ 
          success: false, 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }
    
    // Handle question set creation if needed
    let questionSetId = questionData.questionSetId;
    
    if (questionData.questionSetName && questionData.questionSetName.trim() && !questionSetId) {
      // Create new question set
      const questionSetData = {
        name: questionData.questionSetName,
        curriculumId: questionData.curriculumId,
        maxQuestions: 10,
        description: '',
        isActive: true,
        createdBy: userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      
      const questionSetRef = await adminDb
        .collection('questionSets')
        .add(questionSetData);
      
      questionSetId = questionSetRef.id;
    }
    
    // If no question set specified, use default
    if (!questionSetId) {
      questionSetId = 'default';
    }
    
    // Hash the correct answer
    const correctAnswerHash = hashAnswer(questionData.correctAnswer);
    
    // Prepare question document
    const question: Question = {
      curriculumId: questionData.curriculumId,
      year: questionData.year,
      grade: questionData.grade,
      subject: questionData.subject,
      chapterId: questionData.chapterId,
      questionSetId, // Add question set ID
      type: questionData.type,
      question: {
        text: questionData.question.text,
        imageUrl: questionData.question.imageUrl,
        audioUrl: questionData.question.audioUrl,
        latex: questionData.question.latex
      },
      options: questionData.options,
      correctAnswerHash,
      explanation: questionData.explanation || '',
      hints: questionData.hints || [],
      difficulty: questionData.difficulty,
      points: questionData.points || 10,
      tags: questionData.tags || [],
      estimatedTime: questionData.estimatedTime || 60,
      statistics: {
        attemptCount: 0,
        correctCount: 0,
        averageTime: 0
      },
      isActive: true, // Add active flag
      createdBy: userId, // Add creator ID
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    // Add to Firestore
    const docRef = await adminDb
      .collection(COLLECTIONS.QUESTIONS)
      .add(question);
    
    return json({
      success: true,
      questionId: docRef.id,
      message: 'Question created successfully'
    });
    
  } catch (error) {
    console.error('Error creating question:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// PUT - Update existing question (admin only)
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Check admin role
    const userDoc = await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return json({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }, { status: 403 });
    }

    const { questionId, ...updateData } = await request.json();
    
    if (!questionId) {
      return json({ 
        success: false, 
        error: 'Question ID is required' 
      }, { status: 400 });
    }
    
    // If updating the correct answer, hash it
    if (updateData.correctAnswer) {
      updateData.correctAnswerHash = hashAnswer(updateData.correctAnswer);
      delete updateData.correctAnswer;
    }
    
    // Add updated timestamp
    updateData.updatedAt = FieldValue.serverTimestamp();
    
    // Update the question
    await adminDb
      .collection(COLLECTIONS.QUESTIONS)
      .doc(questionId)
      .update(updateData);
    
    return json({
      success: true,
      message: 'Question updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating question:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// DELETE - Delete a question (admin only)
export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Check admin role
    const userDoc = await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return json({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }, { status: 403 });
    }

    const { questionId } = await request.json();
    
    if (!questionId) {
      return json({ 
        success: false, 
        error: 'Question ID is required' 
      }, { status: 400 });
    }
    
    // Delete the question
    await adminDb
      .collection(COLLECTIONS.QUESTIONS)
      .doc(questionId)
      .delete();
    
    // Also delete related progress records
    const progressQuery = await adminDb
      .collection(COLLECTIONS.USER_PROGRESS)
      .where('questionId', '==', questionId)
      .get();
    
    const batch = adminDb.batch();
    progressQuery.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    return json({
      success: true,
      message: 'Question and related progress deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting question:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};