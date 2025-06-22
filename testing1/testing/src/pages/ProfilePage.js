import React, { useState, useEffect } from 'react';
import { FiUser, FiEdit2, FiSave, FiX, FiMapPin, FiCamera, FiMail, FiPhone, FiHome, FiMap, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { auth, db, storage } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LocationService from '../services/LocationService';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postcode: '',
    latitude: '',
    longitude: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    if (!auth.currentUser) return;

    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          country: userData.country || '',
          postcode: userData.postcode || '',
          latitude: userData.latitude || '',
          longitude: userData.longitude || ''
        });
        setProfileImage(userData.photoURL || '');

        // Show location prompt if address is empty
        if (!userData.address) {
          setShowLocationPrompt(true);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    if (!isEditing) {
      toast.info('Please enable edit mode to update your location');
      return;
    }

    setIsGettingLocation(true);
    try {
      const locationData = await LocationService.getLocationWithAddress();
      
      setUserProfile(prev => ({
        ...prev,
        ...locationData
      }));
      
      toast.success('Location updated successfully!');
      setShowLocationPrompt(false);
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error(error.message || 'Failed to get location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      await updateDoc(userRef, {
        ...userProfile,
        updatedAt: new Date().toISOString()
      });

      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setUserProfile({
      ...userProfile,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5242880) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsImageUploading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const storageRef = ref(storage, `profile_images/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: new Date().toISOString()
      });

      setProfileImage(downloadURL);
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to update profile image');
    } finally {
      setIsImageUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="loading-state">
          <FiLoader className="loading-spinner" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <div className="header-actions">
            {!isEditing ? (
              <button className="edit-button" onClick={handleEdit}>
                <FiEdit2 /> Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-button" onClick={handleSave}>
                  <FiSave /> Save Changes
                </button>
                <button className="cancel-button" onClick={() => setIsEditing(false)}>
                  <FiX /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="profile-image-section">
              <div className="profile-image-container">
                {isImageUploading ? (
                  <div className="image-uploading">
                    <FiLoader className="loading-spinner" />
                    <span>Uploading...</span>
                  </div>
                ) : profileImage ? (
                  <img src={profileImage} alt="Profile" className="profile-image" />
                ) : (
                  <div className="profile-image-placeholder">
                    <FiUser />
                  </div>
                )}
                {isEditing && (
                  <label className="image-upload-label" title="Change profile picture">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <FiCamera className="camera-icon" />
                  </label>
                )}
              </div>
              <h2 className="profile-name">{userProfile.name || 'Add Your Name'}</h2>
              <p className="profile-email">
                <FiMail /> {userProfile.email}
              </p>
            </div>

            {showLocationPrompt && (
              <div className="location-prompt">
                <FiMapPin className="location-icon" />
                <p>Add your delivery address to enable location-based services</p>
                {isEditing && (
                  <button 
                    className="get-location-btn" 
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <>
                        <FiLoader className="loading-spinner" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <FiMapPin />
                        Get Current Location
                      </>
                    )}
                  </button>
                )}
                <button onClick={() => setShowLocationPrompt(false)}>Dismiss</button>
              </div>
            )}
          </div>

          <div className="profile-details">
            <div className="details-section">
              <h3>Personal Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <FiUser /> Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={userProfile.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FiPhone /> Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={userProfile.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>

            <div className="details-section">
              <h3>Address Information</h3>
              {isEditing && (
                <div className="location-actions">
                  <button 
                    className="get-location-btn-secondary" 
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <>
                        <FiLoader className="loading-spinner" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <FiMapPin />
                        Get Current Location
                      </>
                    )}
                  </button>
                </div>
              )}
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>
                    <FiHome /> Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={userProfile.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your street address"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={userProfile.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your city"
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={userProfile.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your state"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FiMap /> Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={userProfile.country}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your country"
                  />
                </div>

                <div className="form-group">
                  <label>Postcode</label>
                  <input
                    type="text"
                    name="postcode"
                    value={userProfile.postcode}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your postcode"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;