// src/firebase/config.js

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCVsruyWdHLbyfXMjbdFkiVdtdSbbH1O-k",
  authDomain: "projecttff-80675.firebaseapp.com",
  projectId: "projecttff-80675",
  storageBucket: "projecttff-80675.appspot.com",
  messagingSenderId: "83655158150",
  appId: "1:83655158150:web:c6020e100b9d023800e407",
  measurementId: "G-87532Z9N70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Auth persistence set to LOCAL');
  })
  .catch((error) => {
    console.error("❌ Auth persistence error:", error);
  });

// Verify Firebase initialization
console.log('✅ Firebase initialized with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey.substring(0, 5) + '...' // Only log part of the API key
});

// Check if Google Auth is available
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('✅ User authenticated:', user.email);
  } else {
    console.log('ℹ️ No user authenticated');
  }
});

// Export initialized services
export { auth, db, storage };
