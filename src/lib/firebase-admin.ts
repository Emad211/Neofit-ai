
import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This function implements a singleton pattern to prevent re-initialization.
 * @returns The initialized Firebase Admin app instance.
 */
function initializeFirebaseAdmin() {
  if (adminApp) {
    return adminApp;
  }

  // Check if the app is already initialized by name, which can happen in some environments
  const existingApp = admin.apps.find(app => app?.name === '[DEFAULT]');
  if (existingApp) {
      adminApp = existingApp;
      return adminApp;
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Ensure newlines are correctly formatted
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error("Firebase service account details are missing in environment variables. Please check your .env file and ensure it's loaded correctly.");
  }

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
    console.log('Firebase Admin SDK initialized successfully.');
    return adminApp;
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // Throw a more specific error to help debugging.
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
  }
}

/**
 * Public function to get the initialized Firebase Admin app instance.
 * It calls the internal initialize function.
 */
export function getFirebaseAdmin() {
    return initializeFirebaseAdmin();
}
