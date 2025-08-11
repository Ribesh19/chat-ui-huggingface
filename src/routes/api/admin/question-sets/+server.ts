import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

// GET - Get question sets for a curriculum
export const GET: RequestHandler = async ({ request, url }) => {
  try {
    // Get user ID from Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    const curriculumId = url.searchParams.get('curriculum');
    
    if (!curriculumId) {
      return json({
        success: false,
        error: 'Curriculum ID is required'
      }, { status: 400 });
    }

    // Get question sets for this curriculum
    const questionSetsQuery = adminDb
      .collection('questionSets')
      .where('curriculumId', '==', curriculumId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'asc');

    const questionSetsSnapshot = await questionSetsQuery.get();

    // Get question counts for each set
    const questionSets = await Promise.all(
      questionSetsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Count questions in this set
        const questionsQuery = adminDb
          .collection('questions')
          .where('questionSetId', '==', doc.id)
          .where('isActive', '==', true);

        const questionsSnapshot = await questionsQuery.get();
        const questionCount = questionsSnapshot.size;

        return {
          id: doc.id,
          name: data.name,
          curriculumId: data.curriculumId,
          questionCount,
          maxQuestions: data.maxQuestions || 10,
          createdAt: data.createdAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null
        };
      })
    );

    return json({
      success: true,
      data: questionSets
    });

  } catch (error) {
    console.error('Error fetching question sets:', error);
    return json({ 
      success: false, 
      error: 'Failed to fetch question sets',
      details: error.message
    }, { status: 500 });
  }
};

// POST - Create a new question set
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get user ID from Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    const {
      name,
      curriculumId,
      maxQuestions = 10,
      description = ''
    } = await request.json();

    // Validate required fields
    if (!name || !curriculumId) {
      return json({
        success: false,
        error: 'Name and curriculum ID are required'
      }, { status: 400 });
    }

    // Check if curriculum exists
    const curriculumDoc = await adminDb
      .collection('curriculums')
      .doc(curriculumId)
      .get();

    if (!curriculumDoc.exists) {
      return json({
        success: false,
        error: 'Curriculum not found'
      }, { status: 404 });
    }

    // Create question set
    const questionSetData = {
      name,
      curriculumId,
      maxQuestions,
      description,
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await adminDb
      .collection('questionSets')
      .add(questionSetData);

    return json({
      success: true,
      data: {
        id: docRef.id,
        ...questionSetData
      }
    });

  } catch (error) {
    console.error('Error creating question set:', error);
    return json({ 
      success: false, 
      error: 'Failed to create question set',
      details: error.message
    }, { status: 500 });
  }
};