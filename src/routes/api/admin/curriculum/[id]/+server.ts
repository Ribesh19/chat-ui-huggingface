import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET - Get single curriculum
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

    const curriculumDoc = await adminDb.collection('curriculums').doc(params.id).get();
    
    if (!curriculumDoc.exists) {
      return json({ 
        success: false, 
        error: 'Curriculum not found' 
      }, { status: 404 });
    }

    const curriculumData = {
      id: curriculumDoc.id,
      ...curriculumDoc.data(),
      createdAt: curriculumDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: curriculumDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null
    };

    return json({ 
      success: true, 
      curriculum: curriculumData
    });

  } catch (error) {
    console.error('Error fetching curriculum:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// PUT - Update curriculum
export const PUT: RequestHandler = async ({ request, params }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Unauthorized - Missing authentication token' 
      }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      return json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    const requestData = await request.json();
    const {
      year,
      grade,
      subject,
      chapterId,
      chapterName,
      curriculumDetails,
      level,
      metadata,
      isActive
    } = requestData;

    // Validate required fields
    if (!year || !grade || !subject || !chapterId || !chapterName || !curriculumDetails) {
      return json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if curriculum exists
    const curriculumDoc = await adminDb.collection('curriculums').doc(params.id).get();
    if (!curriculumDoc.exists) {
      return json({ 
        success: false, 
        error: 'Curriculum not found' 
      }, { status: 404 });
    }

    // Check if chapterId conflicts with another curriculum (if changed)
    const currentData = curriculumDoc.data();
    if (chapterId !== currentData?.chapterId) {
      const existingQuery = await adminDb
        .collection('curriculums')
        .where('chapterId', '==', chapterId)
        .where('grade', '==', parseInt(grade))
        .where('subject', '==', subject.toLowerCase())
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        return json({ 
          success: false, 
          error: 'A curriculum with this chapter ID already exists for this grade and subject' 
        }, { status: 400 });
      }
    }

    const updateData = {
      year: parseInt(year),
      grade: parseInt(grade),
      subject: subject.toLowerCase(),
      chapterId,
      chapterName,
      curriculumDetails: {
        topics: curriculumDetails.topics || [],
        learningObjectives: curriculumDetails.learningObjectives || [],
        prerequisites: curriculumDetails.prerequisites || [],
        estimatedHours: curriculumDetails.estimatedHours || 1,
        orderIndex: curriculumDetails.orderIndex || 1,
        description: curriculumDetails.description || ''
      },
      level: level || 'beginner',
      isActive: isActive !== false,
      metadata: {
        region: metadata?.region || 'US',
        board: metadata?.board || 'Common Core',
        language: metadata?.language || 'en',
        author: currentData?.metadata?.author || decodedToken.email,
        version: metadata?.version || '1.0',
        ...metadata
      },
      updatedBy: decodedToken.email,
      updatedAt: FieldValue.serverTimestamp()
    };

    await adminDb.collection('curriculums').doc(params.id).update(updateData);
    
    console.log('✅ Curriculum updated:', params.id, chapterName);

    return json({ 
      success: true, 
      message: 'Curriculum updated successfully',
      curriculumId: params.id
    });

  } catch (error) {
    console.error('Error updating curriculum:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// DELETE - Delete curriculum
export const DELETE: RequestHandler = async ({ request, params }) => {
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

    // Check if curriculum is being used in questions
    const questionQuery = await adminDb
      .collection('questions')
      .where('curriculumId', '==', params.id)
      .limit(1)
      .get();

    if (!questionQuery.empty) {
      return json({ 
        success: false, 
        error: 'Cannot delete curriculum - it is being used by existing questions. Delete the questions first or reassign them to another curriculum.' 
      }, { status: 400 });
    }

    await adminDb.collection('curriculums').doc(params.id).delete();
    
    console.log('✅ Curriculum deleted:', params.id);

    return json({ 
      success: true, 
      message: 'Curriculum deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting curriculum:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};