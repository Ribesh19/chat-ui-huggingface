import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET - Get single grade
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

    const gradeDoc = await adminDb.collection('grades').doc(params.id).get();
    
    if (!gradeDoc.exists) {
      return json({ 
        success: false, 
        error: 'Grade not found' 
      }, { status: 404 });
    }

    const gradeData = {
      id: gradeDoc.id,
      ...gradeDoc.data(),
      createdAt: gradeDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: gradeDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null
    };

    return json({ 
      success: true, 
      grade: gradeData
    });

  } catch (error) {
    console.error('Error fetching grade:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// PUT - Update grade
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
    const { gradeNumber, gradeName, description, ageRange, isActive } = requestData;

    // Validate required fields
    if (!gradeNumber || !gradeName) {
      return json({ 
        success: false, 
        error: 'Grade number and name are required' 
      }, { status: 400 });
    }

    // Check if grade exists
    const gradeDoc = await adminDb.collection('grades').doc(params.id).get();
    if (!gradeDoc.exists) {
      return json({ 
        success: false, 
        error: 'Grade not found' 
      }, { status: 404 });
    }

    // Check if grade number conflicts with another grade
    const existingQuery = await adminDb
      .collection('grades')
      .where('gradeNumber', '==', parseInt(gradeNumber))
      .get();

    const hasConflict = existingQuery.docs.some(doc => doc.id !== params.id);
    
    if (hasConflict) {
      return json({ 
        success: false, 
        error: 'Another grade with this number already exists' 
      }, { status: 400 });
    }

    const updateData = {
      gradeNumber: parseInt(gradeNumber),
      gradeName: gradeName.trim(),
      description: description?.trim() || '',
      ageRange: ageRange?.trim() || '',
      isActive: isActive !== false,
      updatedBy: decodedToken.email,
      updatedAt: FieldValue.serverTimestamp()
    };

    await adminDb.collection('grades').doc(params.id).update(updateData);
    
    console.log('✅ Grade updated:', params.id, gradeName);

    return json({ 
      success: true, 
      message: 'Grade updated successfully',
      gradeId: params.id
    });

  } catch (error) {
    console.error('Error updating grade:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// DELETE - Delete grade
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

    // Check if grade exists
    const gradeDoc = await adminDb.collection('grades').doc(params.id).get();
    if (!gradeDoc.exists) {
      return json({ 
        success: false, 
        error: 'Grade not found' 
      }, { status: 404 });
    }

    // Check if grade is being used in curriculums
    const curriculumQuery = await adminDb
      .collection('curriculums')
      .where('grade', '==', gradeDoc.data()?.gradeNumber)
      .limit(1)
      .get();

    if (!curriculumQuery.empty) {
      return json({ 
        success: false, 
        error: 'Cannot delete grade - it is being used by existing curriculums' 
      }, { status: 400 });
    }

    // Check if grade is being used in questions
    const questionQuery = await adminDb
      .collection('questions')
      .where('grade', '==', gradeDoc.data()?.gradeNumber)
      .limit(1)
      .get();

    if (!questionQuery.empty) {
      return json({ 
        success: false, 
        error: 'Cannot delete grade - it is being used by existing questions' 
      }, { status: 400 });
    }

    await adminDb.collection('grades').doc(params.id).delete();
    
    console.log('✅ Grade deleted:', params.id);

    return json({ 
      success: true, 
      message: 'Grade deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting grade:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};