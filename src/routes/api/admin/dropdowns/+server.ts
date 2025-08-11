import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyIdToken } from '$lib/firebase/admin';

// GET - Get all dropdown data (grades, subjects, curriculums)
export const GET: RequestHandler = async ({ request, url }) => {
  try {
    console.log('📊 Dropdowns API called with params:', url.searchParams.toString());
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

    const include = url.searchParams.get('include')?.split(',') || ['grades', 'subjects', 'curriculums'];
    const result: any = {};

    // Get grades if requested
    if (include.includes('grades')) {
      try {
        const gradesSnapshot = await adminDb
          .collection('grades')
          .where('isActive', '==', true)
          .get();
        
        result.grades = gradesSnapshot.docs.map(doc => ({
          id: doc.id,
          gradeNumber: doc.data().gradeNumber,
          gradeName: doc.data().gradeName,
          ageRange: doc.data().ageRange
        })).sort((a, b) => a.gradeNumber - b.gradeNumber);
      } catch (error) {
        console.error('Error fetching grades:', error);
        result.grades = [];
      }
    }

    // Get subjects if requested
    if (include.includes('subjects')) {
      try {
        const subjectsSnapshot = await adminDb
          .collection('subjects')
          .where('isActive', '==', true)
          .get();
        
        result.subjects = subjectsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          code: doc.data().code,
          color: doc.data().color,
          icon: doc.data().icon
        })).sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('Error fetching subjects:', error);
        result.subjects = [];
      }
    }

    // Get curriculums if requested
    if (include.includes('curriculums')) {
      try {
        const curriculumsSnapshot = await adminDb
          .collection('curriculums')
          .where('isActive', '==', true)
          .get();
        
        result.curriculums = curriculumsSnapshot.docs.map(doc => ({
          id: doc.id,
          chapterName: doc.data().chapterName,
          chapterId: doc.data().chapterId,
          grade: doc.data().grade,
          subject: doc.data().subject,
          year: doc.data().year
        })).sort((a, b) => {
          if (a.grade !== b.grade) return a.grade - b.grade;
          return a.subject.localeCompare(b.subject);
        });
      } catch (error) {
        console.error('Error fetching curriculums:', error);
        result.curriculums = [];
      }
    }

    return json({ 
      success: true, 
      data: result
    });

  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    return json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
};