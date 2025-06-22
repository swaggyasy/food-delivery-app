import React, { useState, useEffect } from 'react';
import { FiMapPin, FiLoader, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { updateDeliveryLocation } from '../services/OrderService';
import webSocketService from '../services/WebSocketService';
import '../styles/DriverLocationUpdate.css';

const DriverLocationUpdate = ({ orderId, driverId }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    webSocketService.connect(driverId, false);
    
    return () => {
      webSocketService.disconnect();
    };
  }, [driverId]);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const updateLocation = async () => {
    try {
      setIsUpdating(true);
      setLocationError(null);

      const location = await getCurrentLocation();
      setCurrentLocation(location);

      // Update location in database
      await updateDeliveryLocation(orderId, location);

      // Emit to WebSocket for real-time updates
      webSocketService.emitDeliveryLocationUpdate(orderId, location, driverId);

      toast.success('Location updated successfully');
    } catch (error) {
      console.error('Error updating location:', error);
      setLocationError(error.message);
      toast.error(`Failed to update location: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const startLocationTracking = () => {
    setIsTracking(true);
    toast.info('Location tracking started. Updates every 30 seconds.');

    // Update location immediately
    updateLocation();

    // Set up periodic updates
    const interval = setInterval(() => {
      if (isTracking) {
        updateLocation();
      } else {
        clearInterval(interval);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  };

  const stopLocationTracking = () => {
    setIsTracking(false);
    toast.info('Location tracking stopped');
  };

  return (
    <div className="driver-location-update">
      <h3>Driver Location Update</h3>
      
      <div className="location-info">
        {currentLocation ? (
          <div className="current-location">
            <FiMapPin />
            <span>
              <strong>Current Location:</strong> {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </span>
          </div>
        ) : (
          <div className="no-location">
            <FiAlertCircle />
            <span>No location data available</span>
          </div>
        )}
      </div>

      {locationError && (
        <div className="location-error">
          <FiAlertCircle />
          <span>{locationError}</span>
        </div>
      )}

      <div className="location-actions">
        <button
          onClick={updateLocation}
          disabled={isUpdating}
          className="update-btn"
        >
          {isUpdating ? (
            <>
              <FiLoader className="loading-spinner" />
              Updating...
            </>
          ) : (
            <>
              <FiMapPin />
              Update Location
            </>
          )}
        </button>

        {!isTracking ? (
          <button
            onClick={startLocationTracking}
            className="track-btn"
          >
            <FiMapPin />
            Start Tracking
          </button>
        ) : (
          <button
            onClick={stopLocationTracking}
            className="stop-btn"
          >
            <FiMapPin />
            Stop Tracking
          </button>
        )}
      </div>

      <div className="tracking-info">
        <p>
          <strong>Order ID:</strong> {orderId}
        </p>
        <p>
          <strong>Driver ID:</strong> {driverId}
        </p>
        <p>
          <strong>Status:</strong> {isTracking ? '🟢 Tracking Active' : '🔴 Tracking Inactive'}
        </p>
      </div>
    </div>
  );
};

export default DriverLocationUpdate; 