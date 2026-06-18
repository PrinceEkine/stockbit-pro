import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Read environment config, falling back to safe local sandbox settings
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForSandboxAuthTesting123456",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stockbit-pro.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || "stockbit-pro",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stockbit-pro.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.VITE_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || "1:1234546:web:abcd1234efgh"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Firebase Google Sign-In Error:", error);
    throw error;
  }
};

export const logoutFirebase = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Firebase Sign-Out Error:", error);
  }
};
