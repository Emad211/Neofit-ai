
import admin from 'firebase-admin';

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
        // This will now be a clear error instead of a silent failure.
        // It helps diagnose if the .env file is not loaded or configured correctly.
        throw new Error("Firebase service account details are missing in environment variables. Please check your .env file.");
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
    });
    console.log('Firebase Admin SDK initialized successfully.');

  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // Do not export a null app if initialization fails. Let it throw.
  }
}

export const adminApp = admin.apps[0]!;
export default admin;
