import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET - List all grades
export const GET: RequestHandler = async ({ request }) => {
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

    const snapshot = await adminDb.collection('grades').orderBy('gradeNumber', 'asc').get();
    const grades = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }));

    return json({ 
      success: true, 
      grades,
      total: grades.length
    });

  } catch (error) {
    console.error('Error fetching grades:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// POST - Create new grade
export const POST: RequestHandler = async ({ request }) => {
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

    // Check if grade number already exists
    const existingQuery = await adminDb
      .collection('grades')
      .where('gradeNumber', '==', parseInt(gradeNumber))
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return json({ 
        success: false, 
        error: 'A grade with this number already exists' 
      }, { status: 400 });
    }

    const gradeData = {
      gradeNumber: parseInt(gradeNumber),
      gradeName: gradeName.trim(),
      description: description?.trim() || '',
      ageRange: ageRange?.trim() || '',
      isActive: isActive !== false,
      createdBy: decodedToken.email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const gradeRef = await adminDb.collection('grades').add(gradeData);
    
    console.log('✅ Grade created:', gradeRef.id, gradeName);

    return json({ 
      success: true, 
      message: 'Grade created successfully',
      gradeId: gradeRef.id,
      grade: {
        id: gradeRef.id,
        ...gradeData
      }
    });

  } catch (error) {
    console.error('Error creating grade:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};