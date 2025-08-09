
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Ensure dotenv is configured at the earliest point
dotenv.config();

// This prevents re-initialization during hot-reloading in development.
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Check if all required service account details are present
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.warn("Firebase Admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not fully set in .env file. SDK not initialized. AI tools requiring database access will fail.");
    } else {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as any),
        });
        console.log('Firebase Admin SDK initialized successfully from environment variables.');
    }

  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

export const adminApp = admin.apps.length > 0 ? admin.apps[0] : null;
export default admin;
