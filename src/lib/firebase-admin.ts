
import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This function implements a singleton pattern to prevent re-initialization.
 * It includes robust checks for environment variables.
 * @returns The initialized Firebase Admin app instance.
 */
function initializeFirebaseAdmin() {
  // If the app is already initialized, return it to prevent re-initialization.
  if (adminApp) {
    return adminApp;
  }
  
  // Check if the app is already initialized by name, which can happen in some environments.
  const existingApp = admin.apps.find(app => app?.name === '[DEFAULT]');
  if (existingApp) {
      adminApp = existingApp;
      return adminApp;
  }

  // --- Robust Environment Variable Check ---
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    let errorMessage = "Firebase Admin SDK initialization failed due to missing environment variables:";
    if (!projectId) errorMessage += " FIREBASE_PROJECT_ID is missing.";
    if (!clientEmail) errorMessage += " FIREBASE_CLIENT_EMAIL is missing.";
    if (!privateKey) errorMessage += " FIREBASE_PRIVATE_KEY is missing.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const serviceAccount = {
    projectId,
    clientEmail,
    // Ensure newlines are correctly formatted. This is a critical step.
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
    console.log('Firebase Admin SDK initialized successfully.');
    return adminApp;
  } catch (error: any) {
    // Log the specific error for better debugging.
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
