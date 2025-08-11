import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

// GET - Fetch math-mania dashboard data (public endpoint)
export const GET: RequestHandler = async ({ url }) => {
  try {
    const grade = url.searchParams.get('grade') || '5'; // Default to grade 5
    const subject = url.searchParams.get('subject') || 'math'; // Default to math

    // Get active curriculums for the specified grade and subject
    // Handle grade as either string or number for backwards compatibility
    const curriculumsQuery = await adminDb
      .collection('curriculums')
      .where('grade', '==', isNaN(Number(grade)) ? grade : parseInt(grade))
      .where('subject', '==', subject)
      .where('isActive', '==', true)
      .get();

    const curriculums = curriculumsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        chapterName: data.chapterName,
        chapterId: data.chapterId,
        topics: data.curriculumDetails?.topics || [],
        learningObjectives: data.curriculumDetails?.learningObjectives || [],
        estimatedHours: data.curriculumDetails?.estimatedHours || 0,
        orderIndex: data.curriculumDetails?.orderIndex || 0,
        level: data.level,
        year: data.year
      };
    }).sort((a, b) => a.orderIndex - b.orderIndex);

    // If no curriculums found, return early
    if (curriculums.length === 0) {
      return json({
        success: true,
        data: {
          grade: grade, // Keep as string
          subject,
          curriculums: [],
          topicGroups: [],
          stats: {
            totalCurriculums: 0,
            totalQuestions: 0
          }
        }
      });
    }

    // Get questions count for each curriculum
    const curriculumStats = await Promise.all(
      curriculums.map(async (curriculum) => {
        try {
          const questionsQuery = await adminDb
            .collection('questions')
            .where('curriculumId', '==', curriculum.id)
            .get();
          
          return {
            ...curriculum,
            questionCount: questionsQuery.size
          };
        } catch (err) {
          console.warn(`Failed to get question count for curriculum ${curriculum.id}:`, err);
          return {
            ...curriculum,
            questionCount: 0
          };
        }
      })
    );

    // Get all unique topics across curriculums for sidebar
    const allTopics = new Set<string>();
    curriculums.forEach(curriculum => {
      curriculum.topics.forEach(topic => allTopics.add(topic));
    });

    // Group curriculums by topic for sidebar structure
    const topicGroups = Array.from(allTopics).map(topic => ({
      title: topic,
      curriculums: curriculumStats.filter(curr => curr.topics.includes(topic))
    }));

    return json({
      success: true,
      data: {
        grade: grade, // Keep as string
        subject,
        curriculums: curriculumStats,
        topicGroups,
        stats: {
          totalCurriculums: curriculums.length,
          totalQuestions: curriculumStats.reduce((sum, curr) => sum + curr.questionCount, 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching math-mania data:', error);
    console.error('Error stack:', error.stack);
    return json({ 
      success: false, 
      error: 'Failed to load math-mania data',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
};