import React, { useState, useEffect } from 'react';
import { FiSend, FiStar, FiMail, FiPhone, FiMapPin, FiMessageSquare, FiEye, FiEyeOff, FiUser, FiCalendar, FiThumbsUp, FiLoader, FiClock, FiGlobe, FiHeart } from 'react-icons/fi';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import { toast } from 'react-toastify';
import { auth, db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import '../styles/ContactUsPage.css';

const GoogleMapsIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24">
    <path fill="currentColor" d="M12 2C7.589 2 4 5.589 4 9.995C3.971 16.44 11.696 21.784 12 22c0 0 8.029-5.56 8-12C20 5.589 16.411 2 12 2zM12 14c-2.21 0-4-1.79-4-4s1.79-4 4-4s4 1.79 4 4S14.21 14 12 14z"/>
  </svg>
);

const WazeIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24">
    <path fill="currentColor" d="M12 1.5C6.477 1.5 2 5.977 2 11.5c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8s8 3.582 8 8s-3.582 8-8 8z"/>
  </svg>
);

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    message: '',
    rating: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showMyFeedback, setShowMyFeedback] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);

  const mapStyles = {
    height: "400px",
    width: "100%",
    borderRadius: "16px"
  };

  const defaultCenter = {
    lat: 1.376926,
    lng: 103.591137
  };

  const markerOptions = {
    icon: {
      path: 'M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z',
      fillColor: '#4299e1',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#FFFFFF',
      scale: 2,
      anchor: { x: 12, y: 22 }
    },
    title: 'Tanjong Frozen',
    animation: 2,
    optimized: false,
    visible: true,
    zIndex: 999
  };

  const { isLoaded, loadError } = useGoogleMaps();

  // Load user's feedback when component mounts or when showMyFeedback changes
  useEffect(() => {
    if (showMyFeedback && auth.currentUser) {
      loadMyFeedbacks();
    }
  }, [showMyFeedback]);

  const loadMyFeedbacks = async () => {
    if (!auth.currentUser) return;

    try {
      setIsLoadingFeedbacks(true);
      const feedbacksRef = collection(db, 'feedbacks');
      const q = query(
        feedbacksRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const feedbacks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
      }));
      
      setMyFeedbacks(feedbacks);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      toast.error('Failed to load your feedback');
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  const getRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar 
        key={index}
        className={`star ${index < rating ? 'filled' : ''}`}
        size={16}
      />
    ));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'unread': { color: '#f39c12', text: 'Unread', icon: '⏳' },
      'reviewed': { color: '#27ae60', text: 'Replied', icon: '✅' },
      'pending': { color: '#f39c12', text: 'Pending', icon: '⏳' }
    };
    
    const config = statusConfig[status] || statusConfig['unread'];
    
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.icon} {config.text}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    // Verify authentication state
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error('Please login to submit feedback');
      return;
    }

    setIsSubmitting(true);
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        // Force token refresh at the start
        const token = await currentUser.getIdToken(true);
        console.log('Token refreshed (attempt ' + (retryCount + 1) + '):', {
          tokenPreview: token.substring(0, 10) + '...',
          uid: currentUser.uid,
          email: currentUser.email
        });

        // Verify user document exists
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          console.log('Creating user document...');
          const userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || 'Anonymous',
            isAdmin: currentUser.email === 'admin@gmail.com',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          };
          
          await setDoc(userDocRef, userData);
          console.log('User document created successfully');
        }

        // Prepare feedback data
        const feedbackData = {
          userId: currentUser.uid,
          userName: currentUser.displayName || userDoc.data()?.name || 'Anonymous',
          userEmail: currentUser.email,
          message: formData.message.trim(),
          rating: formData.rating,
          status: 'unread',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Add feedback to Firestore
        const feedbacksRef = collection(db, 'feedbacks');
        const docRef = await addDoc(feedbacksRef, feedbackData);
        
        console.log('Feedback submitted successfully:', {
          feedbackId: docRef.id,
          path: docRef.path,
          userId: feedbackData.userId
        });
        
        // Reset form and show success message
        setFormData({
          message: '',
          rating: 5
        });
        
        toast.success('Thank you for your feedback! We will get back to you soon.');
        
        // Reload feedbacks if the section is open
        if (showMyFeedback) {
          await loadMyFeedbacks();
        }
        
        return; // Exit the function on success

      } catch (error) {
        console.error('Error submitting feedback (attempt ' + (retryCount + 1) + '):', {
          code: error.code,
          message: error.message,
          name: error.name,
          stack: error.stack,
          authState: {
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            isAnonymous: currentUser.isAnonymous
          }
        });

        if (error.code === 'permission-denied' && retryCount < maxRetries) {
          retryCount++;
          console.log('Retrying submission... (attempt ' + (retryCount + 1) + ')');
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Handle specific error cases
        if (error.code === 'permission-denied') {
          toast.error('Unable to submit feedback. Please try logging out and back in.');
        } else if (error.code === 'unauthenticated') {
          toast.error('Session expired. Please log in again.');
        } else {
          toast.error(`Error: ${error.message}`);
        }
        break;
      }
    }
    
    setIsSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleNavigate = (app) => {
    const latitude = defaultCenter.lat;
    const longitude = defaultCenter.lng;
    
    const urls = {
      google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      waze: `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes&zoom=17`
    };

    window.open(urls[app], '_blank');
  };

  const handleMapClick = () => {
    if (window.confirm('Open in Google Maps for directions?')) {
      handleNavigate('google');
    }
  };

  const handleMapLoad = () => {
    setIsMapLoaded(true);
  };

  return (
    <div className="contact-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-icon">
            <FiHeart />
          </div>
          <h1 className="hero-title">Get in Touch</h1>
          <p className="hero-subtitle">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          <div className="hero-stats">
            <div className="stat-item">
              <FiClock />
              <span>24/7 Support</span>
            </div>
            <div className="stat-item">
              <FiGlobe />
              <span>Global Reach</span>
            </div>
            <div className="stat-item">
              <FiStar />
              <span>5-Star Service</span>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-content">
        {/* Contact Information Cards */}
        <div className="contact-cards">
          <div className="contact-card">
            <div className="card-icon">
              <FiMail />
            </div>
            <h3>Email Us</h3>
            <p>asyraafhairol7@gmail.com</p>
            
            <div className="card-action">
              <a href="mailto:support@tanjongfrozen.com" className="action-link">
                Send Email <FiSend />
              </a>
            </div>
          </div>

          <div className="contact-card">
            <div className="card-icon">
              <FiPhone />
            </div>
            <h3>Call Us</h3>
            <p>+60 14-277 5103</p>
            <p>+60 19-765 1945</p>
            <div className="card-action">
              <a href="tel:+60123456789" className="action-link">
                Call Now <FiPhone />
              </a>
            </div>
          </div>

          <div className="contact-card">
            <div className="card-icon">
              <FiMessageSquare />
            </div>
            <h3>Business Hours</h3>
            <p>Monday - Sunday: 5AM - 7PM</p>
            <p>Closed: After 7PM</p>
            
            <div className="card-action">
              <span className="status-indicator online">Online Now</span>
            </div>
          </div>

          <div className="contact-card visit-us">
            <div className="card-icon">
              <FiMapPin />
            </div>
            <h3>Visit Us</h3>
            <p>123 Frozen Street,</p>
            <p>Tanjong District, 12345</p>
            <p>Malaysia</p>
            <div className="card-map">
              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={mapStyles}
                  zoom={17}
                  center={defaultCenter}
                  options={{
                    zoomControl: true,
                    streetViewControl: true,
                    mapTypeControl: true,
                    fullscreenControl: true,
                    styles: [
                      {
                        featureType: "all",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#2c5282" }]
                      },
                      {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#c6e2ff" }]
                      }
                    ]
                  }}
                  onClick={handleMapClick}
                  onLoad={handleMapLoad}
                >
                  <Marker 
                    position={defaultCenter}
                    {...markerOptions}
                    onClick={handleMapClick}
                  />
                </GoogleMap>
              )}
              {isMapLoaded && (
                <div className="navigation-buttons">
                  <button 
                    className="nav-btn google"
                    onClick={() => handleNavigate('google')}
                  >
                    <GoogleMapsIcon />
                    Navigate with Google Maps
                  </button>
                  <button 
                    className="nav-btn waze"
                    onClick={() => handleNavigate('waze')}
                  >
                    <WazeIcon />
                    Navigate with Waze
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Feedback Section */}
        {auth.currentUser && (
          <div className="my-feedback-section">
            <div className="section-header">
              <h2>
                <FiMessageSquare className="section-icon" />
                My Feedback History
              </h2>
              <button 
                className="toggle-btn"
                onClick={() => setShowMyFeedback(!showMyFeedback)}
              >
                {showMyFeedback ? <FiEyeOff /> : <FiEye />}
                {showMyFeedback ? 'Hide' : 'Show'} My Feedback
              </button>
            </div>

            {showMyFeedback && (
              <div className="feedback-history">
                {isLoadingFeedbacks ? (
                  <div className="loading-feedback">
                    <FiLoader className="loading-spinner" />
                    <p>Loading your feedback...</p>
                  </div>
                ) : myFeedbacks.length === 0 ? (
                  <div className="no-feedback">
                    <FiMessageSquare className="no-feedback-icon" />
                    <p>You haven't submitted any feedback yet.</p>
                    <p className="no-feedback-subtitle">Submit your first feedback using the form below!</p>
                  </div>
                ) : (
                  <div className="feedback-list">
                    {myFeedbacks.map(feedback => (
                      <div key={feedback.id} className="feedback-item">
                        <div className="feedback-header">
                          <div className="feedback-meta">
                            <div className="feedback-rating">
                              {getRatingStars(feedback.rating)}
                            </div>
                            <span className="feedback-date">
                              <FiCalendar />
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                            {getStatusBadge(feedback.status)}
                          </div>
                        </div>
                        
                        <div className="feedback-content">
                          <p className="feedback-message">{feedback.message}</p>
                        </div>

                        {feedback.adminResponse && (
                          <div className="admin-reply">
                            <div className="reply-header">
                              <FiThumbsUp className="reply-icon" />
                              <span>Admin Response</span>
                              <span className="reply-date">
                                {new Date(feedback.adminResponse.respondedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="reply-message">{feedback.adminResponse.response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback Form */}
        <div className="feedback-form">
          <div className="form-header">
            <h2>Send us a Message</h2>
            <p>Share your thoughts, suggestions, or any questions you might have</p>
          </div>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="rating">How would you rate us?</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= formData.rating ? 'active' : ''}`}
                    onClick={() => handleRatingChange(star)}
                  >
                    <FiStar />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message">Your Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                placeholder="How can we help you today? Share your experience, suggestions, or any questions..."
                rows="5"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              <FiSend />
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;