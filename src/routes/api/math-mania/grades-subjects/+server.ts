import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

// GET - Get all available grades and subjects (public endpoint)
export const GET: RequestHandler = async () => {
  try {
    // Get all active grades
    const gradesQuery = await adminDb
      .collection('grades')
      .where('isActive', '==', true)
      .get();

    const grades = gradesQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        gradeNumber: data.gradeNumber, // Now can be string like "11Plus"
        gradeName: data.gradeName,
        ageRange: data.ageRange
      };
    }).sort((a, b) => {
      // Sort by string comparison if either is a string, otherwise by number
      if (typeof a.gradeNumber === 'string' || typeof b.gradeNumber === 'string') {
        return String(a.gradeNumber).localeCompare(String(b.gradeNumber));
      }
      return a.gradeNumber - b.gradeNumber;
    });

    // Get all active subjects
    const subjectsQuery = await adminDb
      .collection('subjects')
      .where('isActive', '==', true)
      .get();

    const subjects = subjectsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        code: data.code,
        color: data.color,
        icon: data.icon
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Get curriculum counts for each grade/subject combination
    const curriculumsQuery = await adminDb
      .collection('curriculums')
      .where('isActive', '==', true)
      .get();

    const curriculumStats = {};
    curriculumsQuery.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.grade}-${data.subject}`;
      if (!curriculumStats[key]) {
        curriculumStats[key] = 0;
      }
      curriculumStats[key]++;
    });
    
    console.log('📊 Grades found:', grades.map(g => ({ gradeNumber: g.gradeNumber, gradeName: g.gradeName })));
    console.log('📊 Subjects found:', subjects.map(s => s.code));
    console.log('📊 Curriculum stats keys:', Object.keys(curriculumStats));
    console.log('📊 Curriculum stats:', curriculumStats);

    // Enhance grades and subjects with curriculum counts
    const gradesWithStats = grades.map(grade => ({
      ...grade,
      subjects: subjects.map(subject => ({
        ...subject,
        curriculumCount: curriculumStats[`${grade.gradeNumber}-${subject.code}`] || 0
      })).filter(subject => subject.curriculumCount > 0) // Only show subjects with curriculum
    })).filter(grade => grade.subjects.length > 0); // Only show grades with subjects

    return json({
      success: true,
      data: {
        grades: gradesWithStats,
        allSubjects: subjects,
        stats: {
          totalGrades: grades.length,
          totalSubjects: subjects.length,
          totalCombinations: Object.keys(curriculumStats).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching grades and subjects:', error);
    return json({ 
      success: false, 
      error: 'Failed to load grades and subjects',
      details: error.message
    }, { status: 500 });
  }
};