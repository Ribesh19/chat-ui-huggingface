import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

// GET - Fetch questions for exercise mode (public endpoint)
export const GET: RequestHandler = async ({ url }) => {
  try {
    const curriculumId = url.searchParams.get('curriculum');
    const questionIndex = url.searchParams.get('question');
    const grade = url.searchParams.get('grade') || '5';
    const subject = url.searchParams.get('subject') || 'math';

    if (!curriculumId) {
      return json({ 
        success: false, 
        error: 'Curriculum ID is required' 
      }, { status: 400 });
    }

    // Get curriculum info
    const curriculumDoc = await adminDb
      .collection('curriculums')
      .doc(curriculumId)
      .get();

    if (!curriculumDoc.exists) {
      return json({ 
        success: false, 
        error: 'Curriculum not found' 
      }, { status: 404 });
    }

    const curriculumData = curriculumDoc.data();

    // Get all questions for this curriculum
    const questionsQuery = await adminDb
      .collection('questions')
      .where('curriculumId', '==', curriculumId)
      .get();

    const questions = questionsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        curriculumId: data.curriculumId,
        type: data.type,
        question: data.question,
        options: data.options,
        explanation: data.explanation,
        hints: data.hints || [],
        difficulty: data.difficulty,
        points: data.points,
        tags: data.tags || [],
        estimatedTime: data.estimatedTime,
        statistics: data.statistics || { attemptCount: 0, correctCount: 0, averageTime: 0 },
        createdAt: data.createdAt
      };
    }).sort((a, b) => {
      // Sort by createdAt if available, otherwise by id
      if (a.createdAt && b.createdAt) {
        return a.createdAt.toDate() - b.createdAt.toDate();
      }
      return a.id.localeCompare(b.id);
    });

    if (questions.length === 0) {
      return json({ 
        success: false, 
        error: 'No questions found for this curriculum' 
      }, { status: 404 });
    }

    // Get grade and subject info for breadcrumb
    let gradeInfo = null;
    let subjectInfo = null;

    try {
      const gradeQuery = await adminDb
        .collection('grades')
        .where('gradeNumber', '==', parseInt(grade))
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!gradeQuery.empty) {
        const gradeDoc = gradeQuery.docs[0];
        gradeInfo = {
          gradeNumber: gradeDoc.data().gradeNumber,
          gradeName: gradeDoc.data().gradeName
        };
      }

      const subjectQuery = await adminDb
        .collection('subjects')
        .where('code', '==', subject)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!subjectQuery.empty) {
        const subjectDoc = subjectQuery.docs[0];
        subjectInfo = {
          name: subjectDoc.data().name,
          code: subjectDoc.data().code
        };
      }
    } catch (err) {
      console.warn('Failed to fetch grade/subject info:', err);
    }

    // If specific question index requested, return just that question
    if (questionIndex) {
      const index = parseInt(questionIndex) - 1; // Convert to 0-based index
      if (index >= 0 && index < questions.length) {
        return json({
          success: true,
          data: {
            curriculum: {
              id: curriculumDoc.id,
              chapterName: curriculumData.chapterName,
              topics: curriculumData.curriculumDetails?.topics || [],
              level: curriculumData.level
            },
            question: questions[index],
            questionIndex: index + 1,
            totalQuestions: questions.length,
            breadcrumb: {
              grade: gradeInfo,
              subject: subjectInfo,
              curriculum: curriculumData.chapterName
            }
          }
        });
      } else {
        return json({ 
          success: false, 
          error: 'Question index out of range' 
        }, { status: 404 });
      }
    }

    // Return all questions for the curriculum
    return json({
      success: true,
      data: {
        curriculum: {
          id: curriculumDoc.id,
          chapterName: curriculumData.chapterName,
          topics: curriculumData.curriculumDetails?.topics || [],
          level: curriculumData.level
        },
        questions,
        totalQuestions: questions.length,
        breadcrumb: {
          grade: gradeInfo,
          subject: subjectInfo,
          curriculum: curriculumData.chapterName
        }
      }
    });

  } catch (error) {
    console.error('Error fetching exercise data:', error);
    return json({ 
      success: false, 
      error: 'Failed to load exercise data',
      details: error.message
    }, { status: 500 });
  }
};