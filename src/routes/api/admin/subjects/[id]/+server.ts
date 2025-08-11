import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET - Get single subject
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

    const subjectDoc = await adminDb.collection('subjects').doc(params.id).get();
    
    if (!subjectDoc.exists) {
      return json({ 
        success: false, 
        error: 'Subject not found' 
      }, { status: 404 });
    }

    const subjectData = {
      id: subjectDoc.id,
      ...subjectDoc.data(),
      createdAt: subjectDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: subjectDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null
    };

    return json({ 
      success: true, 
      subject: subjectData
    });

  } catch (error) {
    console.error('Error fetching subject:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// PUT - Update subject
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
    const { name, code, description, color, icon, isActive } = requestData;

    // Validate required fields
    if (!name || !code) {
      return json({ 
        success: false, 
        error: 'Subject name and code are required' 
      }, { status: 400 });
    }

    // Check if subject exists
    const subjectDoc = await adminDb.collection('subjects').doc(params.id).get();
    if (!subjectDoc.exists) {
      return json({ 
        success: false, 
        error: 'Subject not found' 
      }, { status: 404 });
    }

    // Check if code conflicts with another subject
    const existingQuery = await adminDb
      .collection('subjects')
      .where('code', '==', code.toLowerCase().trim())
      .get();

    const hasConflict = existingQuery.docs.some(doc => doc.id !== params.id);
    
    if (hasConflict) {
      return json({ 
        success: false, 
        error: 'Another subject with this code already exists' 
      }, { status: 400 });
    }

    const updateData = {
      name: name.trim(),
      code: code.toLowerCase().trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6',
      icon: icon || 'book',
      isActive: isActive !== false,
      updatedBy: decodedToken.email,
      updatedAt: FieldValue.serverTimestamp()
    };

    await adminDb.collection('subjects').doc(params.id).update(updateData);
    
    console.log('✅ Subject updated:', params.id, name);

    return json({ 
      success: true, 
      message: 'Subject updated successfully',
      subjectId: params.id
    });

  } catch (error) {
    console.error('Error updating subject:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// DELETE - Delete subject
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

    // Check if subject exists
    const subjectDoc = await adminDb.collection('subjects').doc(params.id).get();
    if (!subjectDoc.exists) {
      return json({ 
        success: false, 
        error: 'Subject not found' 
      }, { status: 404 });
    }

    // Check if subject is being used in curriculums
    const curriculumQuery = await adminDb
      .collection('curriculums')
      .where('subject', '==', subjectDoc.data()?.code)
      .limit(1)
      .get();

    if (!curriculumQuery.empty) {
      return json({ 
        success: false, 
        error: 'Cannot delete subject - it is being used by existing curriculums' 
      }, { status: 400 });
    }

    // Check if subject is being used in questions
    const questionQuery = await adminDb
      .collection('questions')
      .where('subject', '==', subjectDoc.data()?.code)
      .limit(1)
      .get();

    if (!questionQuery.empty) {
      return json({ 
        success: false, 
        error: 'Cannot delete subject - it is being used by existing questions' 
      }, { status: 400 });
    }

    await adminDb.collection('subjects').doc(params.id).delete();
    
    console.log('✅ Subject deleted:', params.id);

    return json({ 
      success: true, 
      message: 'Subject deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting subject:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};