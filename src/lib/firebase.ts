import { getApp, getApps, initializeApp } from "firebase/app";

// Historical Firebase modules are still present while the old UI is migrated.
// Preview builds must never fail merely because Firebase credentials are absent.
// Product data for this revival branch comes from the NeoFit demo adapter and will
// be replaced by Supabase/Nutrition Core integrations in focused follow-up work.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoNeoFitPreviewKey0000000000000",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "neofit-preview.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "neofit-preview",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "neofit-preview.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:neofitpreview",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-NEOFITPREVIEW",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };
