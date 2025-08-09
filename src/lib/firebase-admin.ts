
import admin from 'firebase-admin';

// This prevents re-initialization during hot-reloading in development.
if (!admin.apps.length) {
  try {
    // In a real production environment, you would use a more secure way
    // to load your service account, like environment variables or a secret manager.
    // For this demonstration, we assume it might be configured elsewhere
    // or that initialization will be handled carefully.
    
    // The conditional check for process.env variables is removed to prevent
    // the app from crashing if they are not set. This allows the developer
    // to run the app and configure it later.
    
    if (process.env.FIREBASE_PROJECT_ID) {
         admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        console.log('Firebase Admin SDK initialized successfully from environment variables.');
    } else {
        // This is a fallback for development if env vars are not set.
        // It will likely fail if not configured, but won't crash the server on startup.
        console.warn("Firebase Admin environment variables not set. SDK not initialized. AI tools requiring database access will fail.");
    }

  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

export const adminApp = admin.apps.length > 0 ? admin.apps[0] : null;
export default admin;
