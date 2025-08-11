import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, verifyAnswer } from '$lib/firebase/admin';

// POST - Check answer for a question (public endpoint)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { questionId, selectedAnswer } = await request.json();

    if (!questionId || selectedAnswer === undefined) {
      return json({ 
        success: false, 
        error: 'Question ID and selected answer are required' 
      }, { status: 400 });
    }

    // Get the question from Firestore
    const questionDoc = await adminDb
      .collection('questions')
      .doc(questionId)
      .get();

    if (!questionDoc.exists) {
      return json({ 
        success: false, 
        error: 'Question not found' 
      }, { status: 404 });
    }

    const questionData = questionDoc.data();
    const correctAnswerHash = questionData.correctAnswerHash;

    if (!correctAnswerHash) {
      return json({ 
        success: false, 
        error: 'Question has no correct answer configured' 
      }, { status: 500 });
    }

    // Verify the answer using the hash
    const isCorrect = verifyAnswer(selectedAnswer, correctAnswerHash);

    // Update question statistics
    try {
      const newAttemptCount = (questionData.statistics?.attemptCount || 0) + 1;
      const newCorrectCount = (questionData.statistics?.correctCount || 0) + (isCorrect ? 1 : 0);
      
      await adminDb
        .collection('questions')
        .doc(questionId)
        .update({
          'statistics.attemptCount': newAttemptCount,
          'statistics.correctCount': newCorrectCount,
          updatedAt: new Date()
        });
    } catch (err) {
      console.warn('Failed to update question statistics:', err);
      // Don't fail the request if stats update fails
    }

    return json({
      success: true,
      data: {
        isCorrect,
        explanation: questionData.explanation || '',
        correctAnswer: isCorrect ? selectedAnswer : 'Answer not revealed',
        points: isCorrect ? (questionData.points || 10) : 0,
        difficulty: questionData.difficulty,
        hints: questionData.hints || []
      }
    });

  } catch (error) {
    console.error('Error checking answer:', error);
    return json({ 
      success: false, 
      error: 'Failed to check answer',
      details: error.message
    }, { status: 500 });
  }
};