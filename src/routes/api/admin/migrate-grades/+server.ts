import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';

// POST - Migrate grades from numbers to strings
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Check authentication
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

    const { fromGrade, toGrade } = await request.json();
    
    if (!fromGrade || !toGrade) {
      return json({ 
        success: false, 
        error: 'Please provide fromGrade and toGrade parameters' 
      }, { status: 400 });
    }

    // Get all curriculums with the old grade
    const curriculumsQuery = await adminDb
      .collection('curriculums')
      .where('grade', '==', isNaN(Number(fromGrade)) ? fromGrade : parseInt(fromGrade))
      .get();

    if (curriculumsQuery.empty) {
      return json({ 
        success: false, 
        error: `No curriculums found with grade: ${fromGrade}` 
      }, { status: 404 });
    }

    // Update each curriculum
    const batch = adminDb.batch();
    let updateCount = 0;

    curriculumsQuery.docs.forEach(doc => {
      batch.update(doc.ref, {
        grade: toGrade,
        updatedAt: new Date()
      });
      updateCount++;
    });

    // Commit the batch update
    await batch.commit();

    console.log(`✅ Successfully migrated ${updateCount} curriculums from grade ${fromGrade} to ${toGrade}`);

    return json({ 
      success: true, 
      message: `Successfully migrated ${updateCount} curriculums`,
      details: {
        fromGrade,
        toGrade,
        updatedCount: updateCount
      }
    });

  } catch (error) {
    console.error('Error during grade migration:', error);
    return json({ 
      success: false, 
      error: 'Migration failed',
      details: error.message
    }, { status: 500 });
  }
};