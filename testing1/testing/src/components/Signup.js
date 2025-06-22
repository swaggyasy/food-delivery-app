import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { signInWithGoogle } from '../services/firebase';
import LocationPermissionPopup from './LocationPermissionPopup';
import '../styles/Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const handleSuccessfulSignup = (userData, targetPath) => {
    // Store user data in localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (userData.isAdmin) {
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminEmail', userData.email);
    }
    
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.phone.trim()) {
        throw new Error('Phone number is required');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      console.log('Attempting to create account for:', formData.email); // Debug log

      // Check if email already exists in Firebase Auth
      const signInMethods = await fetchSignInMethodsForEmail(auth, formData.email);
      console.log('Existing sign-in methods:', signInMethods); // Debug log

      if (signInMethods.length > 0) {
        if (signInMethods.includes('google.com')) {
          throw new Error('This email is already registered with Google. Please use "Sign in with Google" instead.');
        } else {
          throw new Error('This email is already registered. Please use the login page instead.');
        }
      }

      // Create user in Firebase Auth
      console.log('Creating user in Firebase Auth...'); // Debug log
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      const user = userCredential.user;
      console.log('User created in Firebase Auth:', user.uid); // Debug log

      // Update profile with name
      await updateProfile(user, {
        displayName: formData.name
      });

      // Determine if user is admin
      const isAdmin = formData.email === 'admin@gmail.com' || formData.email === 'admin2@gmail.com';
      console.log('Is admin user:', isAdmin); // Debug log

      // Create user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        isAdmin: isAdmin,
        photoURL: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log('Creating user document in Firestore:', userData); // Debug log
      await setDoc(userRef, userData);

      // Sign in the user immediately after creation
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      console.log('Account creation successful'); // Debug log
      toast.success(isAdmin ? 'Admin account created successfully!' : 'Account created successfully!');
      
      // Handle successful signup
      const targetPath = isAdmin ? '/admin' : '/dashboard';
      handleSuccessfulSignup(userData, targetPath);
      
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Please use the login page instead.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters long.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection.');
          break;
        default:
          setError(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting Google sign-up...');
      const user = await signInWithGoogle();
      if (user) {
        console.log('Google sign-up successful, user:', user.email);
        
        // Wait a moment for localStorage to be updated
        setTimeout(() => {
          // Get user data from localStorage
          const userData = JSON.parse(localStorage.getItem('currentUser'));
          console.log('User data from localStorage:', userData);
          
          const targetPath = userData?.isAdmin ? '/admin' : '/dashboard';
          handleSuccessfulSignup(userData, targetPath);
        }, 100);
      } else {
        console.log('No user returned from Google sign-up');
        setError('Google sign-up failed. Please try again.');
      }
    } catch (error) {
      console.error('Google signup error:', error);
      setError(error.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Animated background shapes */}
      <div className="shape"></div>
      <div className="shape"></div>
      
      <div className="signup-card">
        <h1>Create Account</h1>
        <p className="subtitle">Join us to get started</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FiUser className="input-icon" />
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <FiPhone className="input-icon" />
            <input
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
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
              onChange={handleChange}
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

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex="-1"
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button type="submit" className="signup-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <button 
          className="google-btn" 
          onClick={handleGoogleSignup}
          disabled={isLoading}
        >
          <FaGoogle className="google-icon" />
          Sign up with Google
        </button>

        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link-btn">
              Sign In
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

export default Signup;