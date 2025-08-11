import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

// GET - Get user's answer history for a session or curriculum
export const GET: RequestHandler = async ({ request, url }) => {
  try {
    // Get user ID from Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    const sessionId = url.searchParams.get('session');
    const curriculumId = url.searchParams.get('curriculum');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // Simplified query approach - avoid complex composite indexes for now
    let historyQuery = adminDb
      .collection('answerHistory')
      .where('userId', '==', userId)
      .limit(limit);

    // Add additional filters only if we have simple indexes
    if (sessionId) {
      // For specific session, filter by session ID
      historyQuery = adminDb
        .collection('answerHistory')
        .where('userId', '==', userId)
        .where('sessionId', '==', sessionId)
        .limit(limit);
    } else if (curriculumId) {
      // For curriculum filter, we'll filter in memory to avoid index complexity
      historyQuery = adminDb
        .collection('answerHistory')
        .where('userId', '==', userId)
        .limit(500); // Get more data to filter in memory
    }

    const historySnapshot = await historyQuery.get();
    
    // Handle empty collection gracefully
    if (historySnapshot.empty) {
      return json({
        success: true,
        data: {
          history: [],
          sessions: []
        }
      });
    }

    let history = historySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        answeredAt: data.answeredAt?.toDate ? data.answeredAt.toDate() : (data.answeredAt || null)
      };
    });
    
    // Filter by curriculum in memory if needed (to avoid complex indexes)
    if (curriculumId && !sessionId) {
      history = history.filter(item => item.curriculumId === curriculumId);
    }
    
    // Sort by answeredAt in memory
    history.sort((a, b) => {
      const dateA = a.answeredAt || new Date(0);
      const dateB = b.answeredAt || new Date(0);
      return dateB.getTime() - dateA.getTime(); // Descending
    });
    
    // Apply limit after filtering and sorting
    history = history.slice(0, limit);

    // Group by session if needed
    const sessions = {};
    history.forEach(item => {
      if (!item.sessionId) {
        console.warn('Answer history item missing sessionId:', item);
        return;
      }
      
      if (!sessions[item.sessionId]) {
        sessions[item.sessionId] = {
          sessionId: item.sessionId,
          curriculumId: item.curriculumId,
          answers: [],
          totalQuestions: 0,
          correctAnswers: 0,
          startTime: item.answeredAt,
          endTime: item.answeredAt
        };
      }
      
      sessions[item.sessionId].answers.push(item);
      sessions[item.sessionId].totalQuestions++;
      if (item.isCorrect) {
        sessions[item.sessionId].correctAnswers++;
      }
      
      // Update time range - handle null dates safely
      if (item.answeredAt && sessions[item.sessionId].startTime) {
        if (item.answeredAt < sessions[item.sessionId].startTime) {
          sessions[item.sessionId].startTime = item.answeredAt;
        }
        if (item.answeredAt > sessions[item.sessionId].endTime) {
          sessions[item.sessionId].endTime = item.answeredAt;
        }
      }
    });

    // Handle empty results gracefully
    const sessionsArray = Object.values(sessions);
    
    return json({
      success: true,
      data: {
        history: history || [],
        sessions: sessionsArray || []
      }
    });

  } catch (error) {
    console.error('Error fetching answer history:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return json({ 
      success: false, 
      error: 'Failed to fetch answer history',
      details: error.message
    }, { status: 500 });
  }
};

// POST - Save answer to history
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get user ID from Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    const {
      sessionId,
      curriculumId,
      questionId,
      questionSetId,
      questionNumber,
      questionText,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      points,
      timeSpent,
      hints
    } = await request.json();

    // Save answer to history
    const answerData = {
      userId,
      sessionId,
      curriculumId,
      questionId,
      questionSetId,
      questionNumber,
      questionText,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      points,
      timeSpent,
      hintsUsed: hints?.length || 0,
      answeredAt: new Date()
    };

    const answerRef = await adminDb
      .collection('answerHistory')
      .add(answerData);

    return json({
      success: true,
      data: {
        id: answerRef.id,
        ...answerData
      }
    });

  } catch (error) {
    console.error('Error saving answer history:', error);
    return json({ 
      success: false, 
      error: 'Failed to save answer',
      details: error.message
    }, { status: 500 });
  }
};