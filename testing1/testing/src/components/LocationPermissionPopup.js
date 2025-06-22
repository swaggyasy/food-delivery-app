import React, { useState } from 'react';
import { FiMapPin, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LocationService from '../services/LocationService';
import '../styles/LocationPermissionPopup.css';

const LocationPermissionPopup = ({ isOpen, onClose, onLocationReceived }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('permission'); // 'permission', 'loading', 'success'

  const handleAllowLocation = async () => {
    setIsLoading(true);
    setStep('loading');

    try {
      const locationData = await LocationService.getLocationWithAddress();
      
      setStep('success');
      toast.success('Location access granted! Your address has been filled in.');
      
      // Wait a moment to show success state
      setTimeout(() => {
        onLocationReceived(locationData);
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Location error:', error);
      toast.error(error.message || 'Failed to get location');
      setStep('permission');
      setIsLoading(false);
    }
  };

  const handleDenyLocation = () => {
    toast.info('You can always add your location manually in your profile');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="location-popup-overlay">
      <div className="location-popup">
        <button className="popup-close-btn" onClick={onClose}>
          <FiX />
        </button>

        {step === 'permission' && (
          <div className="popup-content">
            <div className="popup-icon">
              <FiMapPin />
            </div>
            <h2>Enable Location Access</h2>
            <p>
              Allow us to access your location to automatically fill in your delivery address 
              and provide better service.
            </p>
            <div className="popup-benefits">
              <div className="benefit-item">
                <FiCheck />
                <span>Automatic address detection</span>
              </div>
              <div className="benefit-item">
                <FiCheck />
                <span>Faster checkout process</span>
              </div>
              <div className="benefit-item">
                <FiCheck />
                <span>Accurate delivery estimates</span>
              </div>
            </div>
            <div className="popup-actions">
              <button 
                className="allow-btn" 
                onClick={handleAllowLocation}
                disabled={isLoading}
              >
                <FiMapPin />
                Allow Location Access
              </button>
              <button 
                className="deny-btn" 
                onClick={handleDenyLocation}
                disabled={isLoading}
              >
                Maybe Later
              </button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="popup-content">
            <div className="popup-icon loading">
              <FiLoader />
            </div>
            <h2>Getting Your Location</h2>
            <p>Please wait while we detect your location and fill in your address...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="popup-content">
            <div className="popup-icon success">
              <FiCheck />
            </div>
            <h2>Location Access Granted!</h2>
            <p>Your address has been automatically filled in your profile.</p>
            <div className="success-animation">
              <div className="checkmark"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPermissionPopup; 