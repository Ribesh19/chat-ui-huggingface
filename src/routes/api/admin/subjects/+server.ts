import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET - List all subjects
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

    const snapshot = await adminDb.collection('subjects').orderBy('name', 'asc').get();
    const subjects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }));

    return json({ 
      success: true, 
      subjects,
      total: subjects.length
    });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// POST - Create new subject
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
    const { name, code, description, color, icon, isActive } = requestData;

    // Validate required fields
    if (!name || !code) {
      return json({ 
        success: false, 
        error: 'Subject name and code are required' 
      }, { status: 400 });
    }

    // Check if code already exists
    const existingQuery = await adminDb
      .collection('subjects')
      .where('code', '==', code.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return json({ 
        success: false, 
        error: 'A subject with this code already exists' 
      }, { status: 400 });
    }

    const subjectData = {
      name: name.trim(),
      code: code.toLowerCase().trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6', // Default blue color
      icon: icon || 'book',
      isActive: isActive !== false,
      createdBy: decodedToken.email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const subjectRef = await adminDb.collection('subjects').add(subjectData);
    
    console.log('✅ Subject created:', subjectRef.id, name);

    return json({ 
      success: true, 
      message: 'Subject created successfully',
      subjectId: subjectRef.id,
      subject: {
        id: subjectRef.id,
        ...subjectData
      }
    });

  } catch (error) {
    console.error('Error creating subject:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};