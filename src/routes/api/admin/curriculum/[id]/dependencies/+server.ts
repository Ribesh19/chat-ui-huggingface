import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';

// GET - Get curriculum dependencies (questions using this curriculum)
export const GET: RequestHandler = async ({ request, params }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Unauthorized - Missing authentication token' 
      }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    
    try {
      await verifyIdToken(idToken);
    } catch (error) {
      return json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    // Check if curriculum exists
    const curriculumDoc = await adminDb.collection('curriculums').doc(params.id).get();
    if (!curriculumDoc.exists) {
      return json({ 
        success: false, 
        error: 'Curriculum not found' 
      }, { status: 404 });
    }

    // Get questions using this curriculum
    const questionsQuery = await adminDb
      .collection('questions')
      .where('curriculumId', '==', params.id)
      .get();

    const questions = questionsQuery.docs.map(doc => ({
      id: doc.id,
      question: doc.data().question?.text || 'No question text',
      type: doc.data().type || 'unknown',
      difficulty: doc.data().difficulty || 'unknown',
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }));

    // Get user progress records using this curriculum
    const progressQuery = await adminDb
      .collection('user_progress')
      .where('curriculumId', '==', params.id)
      .limit(10) // Just count them, don't need all
      .get();

    return json({ 
      success: true, 
      curriculum: {
        id: curriculumDoc.id,
        chapterName: curriculumDoc.data()?.chapterName
      },
      dependencies: {
        questions: questions,
        questionCount: questions.length,
        userProgressCount: progressQuery.size,
        canDelete: questions.length === 0 && progressQuery.size === 0
      }
    });

  } catch (error) {
    console.error('Error checking dependencies:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};