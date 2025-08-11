import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';

export const GET: RequestHandler = async ({ request }) => {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        isAdmin: false,
        error: 'Unauthorized - Missing authentication token' 
      }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    
    // Verify the user's ID token
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return json({ 
        success: false, 
        isAdmin: false,
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }
    
    const userId = decodedToken.uid;

    // Check if user has admin role in Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin';
      
      return json({ 
        success: true, 
        isAdmin,
        userProfile: isAdmin ? {
          id: userDoc.id,
          displayName: userData?.displayName,
          email: userData?.email,
          role: userData?.role
        } : null
      });
    } else {
      return json({ 
        success: true, 
        isAdmin: false,
        error: 'User profile not found' 
      });
    }

  } catch (error) {
    console.error('Error checking admin status:', error);
    return json({ 
      success: false, 
      isAdmin: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
};