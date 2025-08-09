
import admin from 'firebase-admin';

// This prevents re-initialization during hot-reloading in development.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.code, error.message);
    // You might want to throw the error or handle it in a way that
    // prevents the app from running in a misconfigured state.
  }
}

export const adminApp = admin.apps[0];
export default admin;
