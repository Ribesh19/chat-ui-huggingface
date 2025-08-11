import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyIdToken } from '$lib/firebase/admin';
import admin from 'firebase-admin';

// POST - Upload image to Firebase Storage
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Check authentication
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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return json({ 
        success: false, 
        error: 'Missing file or path' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return json({ 
        success: false, 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Get Firebase Storage bucket
    const bucket = admin.storage().bucket();
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Firebase Storage
    const blob = bucket.file(path);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: authHeader.substring(7), // Store uploader info
          uploadedAt: new Date().toISOString()
        }
      }
    });

    return new Promise((resolve) => {
      blobStream.on('error', (error) => {
        console.error('Upload error:', error);
        resolve(json({ 
          success: false, 
          error: 'Failed to upload file' 
        }, { status: 500 }));
      });

      blobStream.on('finish', async () => {
        // Make the file publicly accessible
        await blob.makePublic();
        
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
        
        console.log('✅ Image uploaded successfully:', publicUrl);
        
        resolve(json({ 
          success: true, 
          url: publicUrl,
          path: path,
          size: file.size,
          type: file.type
        }));
      });

      blobStream.end(buffer);
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return json({ 
      success: false, 
      error: 'Failed to upload image',
      details: error.message
    }, { status: 500 });
  }
};