import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyAnswer, verifyIdToken } from '$lib/firebase/admin';
import { COLLECTIONS } from '$lib/firebase/types';
import type { Question, UserProgress, AttemptData } from '$lib/firebase/types';
import { FieldValue } from 'firebase-admin/firestore';

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimits = rateLimitStore.get(userId);
  
  if (!userLimits || now > userLimits.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (userLimits.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimits.count++;
  return true;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const startTime = Date.now();
  
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
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
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }
    
    const userId = decodedToken.uid;
    
    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return json({ 
        success: false, 
        error: 'Rate limit exceeded. Please wait before submitting again.' 
      }, { status: 429 });
    }

    // Get request body
    const { questionId, userAnswer, timeSpent, hintsUsed } = await request.json();

    if (!questionId || !userAnswer) {
      return json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Fetch the question from Firestore (server-side with answer)
    const questionDoc = await adminDb
      .collection(COLLECTIONS.QUESTIONS)
      .doc(questionId)
      .get();

    if (!questionDoc.exists) {
      return json({ 
        success: false, 
        error: 'Question not found' 
      }, { status: 404 });
    }

    const question = questionDoc.data() as Question;
    
    // Verify the answer
    const isCorrect = verifyAnswer(userAnswer, question.correctAnswerHash!);
    
    // Calculate points
    let points = 0;
    if (isCorrect) {
      points = question.points;
      
      // Bonus points for speed
      if (timeSpent < question.estimatedTime * 0.5) {
        points = Math.floor(points * 1.5); // 50% bonus for fast answer
      } else if (timeSpent < question.estimatedTime * 0.75) {
        points = Math.floor(points * 1.25); // 25% bonus
      }
      
      // Penalty for hints
      if (hintsUsed > 0) {
        points = Math.floor(points * (1 - 0.1 * hintsUsed)); // -10% per hint
      }
    }

    // Update question statistics
    await adminDb
      .collection(COLLECTIONS.QUESTIONS)
      .doc(questionId)
      .update({
        'statistics.attemptCount': FieldValue.increment(1),
        'statistics.correctCount': isCorrect ? FieldValue.increment(1) : FieldValue.increment(0),
        'statistics.averageTime': FieldValue.increment(timeSpent),
        updatedAt: FieldValue.serverTimestamp()
      });

    // Check if user progress exists
    const progressQuery = await adminDb
      .collection(COLLECTIONS.USER_PROGRESS)
      .where('userId', '==', userId)
      .where('questionId', '==', questionId)
      .limit(1)
      .get();

    const attemptData: AttemptData = {
      attemptNumber: 1,
      selectedAnswer: userAnswer,
      isCorrect,
      timeSpent: timeSpent || 0,
      hintsUsed: hintsUsed || 0,
      timestamp: FieldValue.serverTimestamp()
    };

    if (progressQuery.empty) {
      // Create new progress record
      const progressData: UserProgress = {
        userId,
        questionId,
        curriculumId: question.curriculumId,
        attemptData: [attemptData],
        bestAttempt: {
          isCorrect,
          timeSpent: timeSpent || 0,
          score: points
        },
        status: isCorrect ? 'completed' : 'attempted',
        lastAttemptAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      };

      await adminDb
        .collection(COLLECTIONS.USER_PROGRESS)
        .add(progressData);
    } else {
      // Update existing progress
      const progressDoc = progressQuery.docs[0];
      const existingProgress = progressDoc.data() as UserProgress;
      
      attemptData.attemptNumber = existingProgress.attemptData.length + 1;
      
      const updateData: any = {
        attemptData: FieldValue.arrayUnion(attemptData),
        lastAttemptAt: FieldValue.serverTimestamp()
      };

      // Update best attempt if this is better
      if (isCorrect && !existingProgress.bestAttempt.isCorrect) {
        updateData.bestAttempt = {
          isCorrect,
          timeSpent: timeSpent || 0,
          score: points
        };
        updateData.status = 'completed';
      } else if (isCorrect && timeSpent < existingProgress.bestAttempt.timeSpent) {
        updateData.bestAttempt = {
          isCorrect,
          timeSpent: timeSpent || 0,
          score: points
        };
      }

      // Mark as mastered if answered correctly 3+ times
      const correctCount = existingProgress.attemptData.filter(a => a.isCorrect).length;
      if (isCorrect && correctCount >= 2) {
        updateData.status = 'mastered';
      }

      await adminDb
        .collection(COLLECTIONS.USER_PROGRESS)
        .doc(progressDoc.id)
        .update(updateData);
    }

    // Update user stats
    const userUpdateData: any = {
      'stats.totalQuestionsAnswered': FieldValue.increment(1),
      'stats.totalTimeSpent': FieldValue.increment(Math.floor(timeSpent / 60)),
      'stats.lastActiveDate': FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    if (isCorrect) {
      userUpdateData['stats.totalCorrectAnswers'] = FieldValue.increment(1);
      userUpdateData['stats.totalPoints'] = FieldValue.increment(points);
    }

    await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .update(userUpdateData);

    // Return result (without exposing the actual answer)
    return json({
      success: true,
      isCorrect,
      points,
      explanation: isCorrect ? question.explanation : undefined,
      hint: !isCorrect && hintsUsed < question.hints.length ? question.hints[hintsUsed] : undefined,
      statistics: {
        attemptCount: question.statistics.attemptCount + 1,
        successRate: Math.round(((question.statistics.correctCount + (isCorrect ? 1 : 0)) / 
                                (question.statistics.attemptCount + 1)) * 100)
      }
    });

  } catch (error) {
    console.error('Error validating answer:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};