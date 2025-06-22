import { 
  GoogleAuthProvider, 
  signInWithPopup,
  getRedirectResult,
  signInWithRedirect
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account',
  auth_type: 'reauthenticate'
});

// Function to create/update user document in Firestore
const updateUserInFirestore = async (user) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || '',
      phone: '',  // Will be updated if available
      isAdmin: user.email === 'admin@gmail.com',
      photoURL: user.photoURL || '',
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!userDoc.exists()) {
      // Create new user document
      userData.createdAt = new Date().toISOString();
      await setDoc(userRef, userData);
      console.log('New user document created:', userData);
    } else {
      // Update existing user document
      const existingData = userDoc.data();
      await updateDoc(userRef, {
        ...userData,
        phone: existingData.phone || '',  // Preserve existing phone
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Existing user document updated:', userData);
    }

    // Also store in localStorage for quick access
    localStorage.setItem('currentUser', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
    throw error;
  }
};

// Listen for auth state changes
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      // Update user data in Firestore
      await updateUserInFirestore(user);
    } catch (error) {
      console.error('Error in auth state change:', error);
      toast.error('Error updating user data');
    }
  } else {
    // User is signed out
    localStorage.removeItem('currentUser');
  }
});

export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign-in...');
    
    // Clear any existing auth state
    await auth.signOut();
    
    // Use redirect instead of popup
    await signInWithRedirect(auth, googleProvider);
    
    // The page will redirect to Google and then back to your app
    // The result will be handled by handleGoogleRedirectResult
    
  } catch (error) {
    console.error('Google sign-in error:', error);
    
    // Handle specific error cases
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked. Please allow pop-ups for this site and try again.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error('Failed to sign in with Google. Please try again.');
    }
  }
};

export const handleGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document if it doesn't exist
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || result.user.email.split('@')[0],
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', result.user.uid), userData);
        
        // Store in localStorage
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        // Store existing user data in localStorage
        const userData = userDoc.data();
        localStorage.setItem('currentUser', JSON.stringify({
          uid: result.user.uid,
          email: userData.email,
          name: userData.name,
          isAdmin: userData.isAdmin
        }));
      }
      
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Error handling Google redirect:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await auth.signOut();
    localStorage.removeItem('currentUser');
    toast.success('Successfully signed out!');
  } catch (error) {
    console.error('Error signing out:', error);
    toast.error('Failed to sign out. Please try again.');
    throw error;
  }
};

export { auth }; 