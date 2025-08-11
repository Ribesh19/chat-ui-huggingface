import { getStorage } from 'firebase/storage';
import { app } from './client';

// Initialize Firebase Storage
export const storage = getStorage(app);

// Storage paths
export const STORAGE_PATHS = {
  QUESTION_IMAGES: 'math-mania/question-images',
  CURRICULUM_IMAGES: 'math-mania/curriculum-images',
  USER_AVATARS: 'user-avatars'
};

// Helper to generate a unique filename
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  return `${cleanName}_${timestamp}_${randomString}.${extension}`;
}

// Helper to get storage path for question images
export function getQuestionImagePath(curriculumId: string, questionId: string, filename: string): string {
  return `${STORAGE_PATHS.QUESTION_IMAGES}/${curriculumId}/${questionId}/${filename}`;
}