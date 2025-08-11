import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET - List all curriculums
export const GET: RequestHandler = async ({ request, url }) => {
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

    // Get query parameters
    const grade = url.searchParams.get('grade');
    const subject = url.searchParams.get('subject');
    const isActive = url.searchParams.get('isActive');

    let query = adminDb.collection('curriculums');

    // Apply filters
    if (grade) {
      // Handle grade as string or number
      query = query.where('grade', '==', isNaN(Number(grade)) ? grade : parseInt(grade));
    }
    if (subject) {
      query = query.where('subject', '==', subject);
    }
    if (isActive) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    // Order by creation date
    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const curriculums = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }));

    return json({ 
      success: true, 
      curriculums,
      total: curriculums.length
    });

  } catch (error) {
    console.error('Error fetching curriculums:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// POST - Create new curriculum
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
    const {
      year,
      grade,
      subject,
      chapterId,
      chapterName,
      curriculumDetails,
      level,
      metadata
    } = requestData;

    // Validate required fields
    if (!year || !grade || !subject || !chapterId || !chapterName || !curriculumDetails) {
      return json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if chapterId already exists
    const existingQuery = await adminDb
      .collection('curriculums')
      .where('chapterId', '==', chapterId)
      .where('grade', '==', isNaN(Number(grade)) ? grade : parseInt(grade))
      .where('subject', '==', subject)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return json({ 
        success: false, 
        error: 'A curriculum with this chapter ID already exists for this grade and subject' 
      }, { status: 400 });
    }

    const curriculumData = {
      year: parseInt(year),
      grade: isNaN(Number(grade)) ? grade : parseInt(grade), // Handle string or number grades
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
      isActive: true,
      metadata: {
        region: metadata?.region || 'US',
        board: metadata?.board || 'Common Core',
        language: metadata?.language || 'en',
        author: decodedToken.email,
        version: '1.0',
        ...metadata
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const curriculumRef = await adminDb.collection('curriculums').add(curriculumData);
    
    console.log('✅ Curriculum created:', curriculumRef.id, chapterName);

    return json({ 
      success: true, 
      message: 'Curriculum created successfully',
      curriculumId: curriculumRef.id,
      curriculum: {
        id: curriculumRef.id,
        ...curriculumData
      }
    });

  } catch (error) {
    console.error('Error creating curriculum:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};