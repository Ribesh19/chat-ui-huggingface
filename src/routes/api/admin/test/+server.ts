import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';

// GET - Simple test endpoint to verify Firebase Admin connectivity
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
      const decodedToken = await verifyIdToken(idToken);
      
      // Simple test: try to read from a basic collection or create a test document
      const testDoc = adminDb.collection('admin_test').doc('connectivity');
      await testDoc.set({ 
        tested: true, 
        timestamp: new Date(),
        user: decodedToken.email 
      });
      
      const readBack = await testDoc.get();
      
      return json({ 
        success: true, 
        message: 'Firebase Admin SDK working correctly',
        data: {
          user: decodedToken.email,
          testData: readBack.exists ? readBack.data() : null
        }
      });
      
    } catch (error) {
      return json({ 
        success: false, 
        error: 'Invalid authentication token',
        details: error.message
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Admin test error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
};