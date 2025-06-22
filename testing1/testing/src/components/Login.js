import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { auth, db } from '../firebase/config';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
  signOut,
  getRedirectResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { signInWithGoogle } from '../services/firebase';
import LocationPermissionPopup from './LocationPermissionPopup';
import '../styles/Login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const handleSuccessfulLogin = (userData, targetPath) => {
    // Store user data in localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Show location popup for non-admin users
    if (!userData.isAdmin) {
      setPendingNavigation(targetPath);
      setShowLocationPopup(true);
    } else {
      // Admin users go directly to admin dashboard
      navigate(targetPath);
    }
  };

  const handleLocationReceived = async (locationData) => {
    try {
      // Update user profile with location data
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        ...locationData,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Location data saved to profile:', locationData);
    } catch (error) {
      console.error('Error saving location data:', error);
      // Don't show error to user as this is optional
    }
  };

  const handleLocationPopupClose = () => {
    setShowLocationPopup(false);
    // Navigate to the pending destination
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    console.log('Login attempt started for:', formData.email);

    try {
      // Try to sign in directly
      console.log('Attempting to sign in with email/password...');
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('Sign in successful, user:', userCredential.user.uid);
      
      // Log the full user credential for debugging
      console.log('Full user credential:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified,
        providerId: userCredential.user.providerId,
        displayName: userCredential.user.displayName,
        metadata: userCredential.user.metadata
      });

      try {
        // Get user document from Firestore
        console.log('Fetching user document from Firestore...');
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        console.log('User document exists:', userDoc.exists());
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User Firestore data:', userData);
          
          // Handle successful login
          const targetPath = userData.isAdmin ? '/admin' : '/dashboard';
          handleSuccessfulLogin(userData, targetPath);
        } else {
          // If user document doesn't exist, create it
          console.log('No user document found, creating one...');
          const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: userCredential.user.displayName || userCredential.user.email.split('@')[0],
            isAdmin: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          try {
            await setDoc(doc(db, 'users', userCredential.user.uid), userData);
            console.log('Successfully created user document:', userData);
            
            handleSuccessfulLogin(userData, '/dashboard');
          } catch (createError) {
            console.error('Error creating user document:', createError);
            // Still allow login with basic access
            const basicUserData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: userCredential.user.displayName || '',
              isAdmin: false
            };
            console.log('Storing basic user data after document creation error:', basicUserData);
            handleSuccessfulLogin(basicUserData, '/dashboard');
          }
        }
      } catch (firestoreError) {
        console.error('Error accessing Firestore:', firestoreError);
        // If we can't access Firestore, still allow login with basic access
        const basicUserData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || '',
          isAdmin: false
        };
        console.log('Storing basic user data after Firestore error:', basicUserData);
        handleSuccessfulLogin(basicUserData, '/dashboard');
      }
    } catch (error) {
      console.error('Login error details:', {
        code: error.code,
        message: error.message,
        email: formData.email,
        fullError: error
      });
      
      switch (error.code) {
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email. Please sign up first.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection.');
          break;
        default:
          setError(`Login failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting Google sign-in...');
      const user = await signInWithGoogle();
      if (user) {
        console.log('Google sign-in successful, user:', user.email);
        
        // Wait a moment for localStorage to be updated
        setTimeout(() => {
          // Get user data from localStorage
          const userData = JSON.parse(localStorage.getItem('currentUser'));
          console.log('User data from localStorage:', userData);
          
          const targetPath = userData?.isAdmin ? '/admin' : '/dashboard';
          handleSuccessfulLogin(userData, targetPath);
        }, 100);
      } else {
        console.log('No user returned from Google sign-in');
        setError('Google sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add effect to handle redirect result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('Google sign-in redirect result:', result.user.email);
          const userDoc = await getDoc(doc(db, 'users', result.user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            handleSuccessfulLogin(userData, userData.isAdmin ? '/admin' : '/dashboard');
          } else {
            // Create new user document
            const userData = {
              uid: result.user.uid,
              email: result.user.email,
              name: result.user.displayName || result.user.email.split('@')[0],
              isAdmin: result.user.email === 'admin@gmail.com',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', result.user.uid), userData);
            handleSuccessfulLogin(userData, '/dashboard');
          }
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
        toast.error('Failed to complete Google sign-in');
      }
    };

    handleRedirectResult();
  }, []);

  return (
    <div className="login-container">
      {/* Animated background shapes */}
      <div className="shape"></div>
      <div className="shape"></div>
      
      <div className="login-card">
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to your account to continue</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>        <button 
          className="google-btn" 
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <span className="google-icon">G</span>
          Sign in with Google
        </button>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="link-btn">
              Sign Up
            </Link>
          </p>
          <p>
            <Link to="/forgot-password" className="link-btn">
              Forgot Password?
            </Link>
          </p>
        </div>
      </div>

      {/* Location Permission Popup */}
      <LocationPermissionPopup
        isOpen={showLocationPopup}
        onClose={handleLocationPopupClose}
        onLocationReceived={handleLocationReceived}
      />
    </div>
  );
};

export default LoginPage;