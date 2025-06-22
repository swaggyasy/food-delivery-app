import React, { useState } from 'react';
import { FiMapPin, FiTruck, FiPlay, FiPause } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { updateDeliveryLocation } from '../services/OrderService';
import webSocketService from '../services/WebSocketService';
import '../styles/DriverLocationTest.css';

const DriverLocationTest = ({ orderId }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Test locations around Kuala Lumpur
  const testLocations = [
    { latitude: 3.1390, longitude: 101.6869, name: 'KLCC' },
    { latitude: 3.1410, longitude: 101.6889, name: 'Near KLCC' },
    { latitude: 3.1370, longitude: 101.6849, name: 'Petronas Towers' },
    { latitude: 3.1430, longitude: 101.6909, name: 'Bukit Bintang' },
    { latitude: 3.1450, longitude: 101.6929, name: 'Pavilion KL' },
    { latitude: 3.1470, longitude: 101.6949, name: 'Lot 10' },
    { latitude: 3.1490, longitude: 101.6969, name: 'Fahrenheit 88' },
    { latitude: 3.1510, longitude: 101.6989, name: 'Sungei Wang' },
  ];

  const simulateDriverMovement = async () => {
    if (!orderId) {
      toast.error('No order ID provided');
      return;
    }

    setIsSimulating(true);
    let locationIndex = 0;

    const interval = setInterval(async () => {
      if (!isSimulating) {
        clearInterval(interval);
        return;
      }

      const location = testLocations[locationIndex];
      setCurrentLocation(location);

      try {
        // Update location in database
        await updateDeliveryLocation(orderId, location);

        // Emit to WebSocket for real-time updates
        webSocketService.emitDeliveryLocationUpdate(orderId, location, 'test-driver');

        toast.success(`Driver moved to ${location.name}`);
      } catch (error) {
        console.error('Error updating location:', error);
        toast.error('Failed to update location');
      }

      locationIndex = (locationIndex + 1) % testLocations.length;
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  };

  const startSimulation = () => {
    simulateDriverMovement();
  };

  const stopSimulation = () => {
    setIsSimulating(false);
  };

  const updateToRandomLocation = async () => {
    if (!orderId) {
      toast.error('No order ID provided');
      return;
    }

    const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];
    setCurrentLocation(randomLocation);

    try {
      await updateDeliveryLocation(orderId, randomLocation);
      webSocketService.emitDeliveryLocationUpdate(orderId, randomLocation, 'test-driver');
      toast.success(`Driver moved to ${randomLocation.name}`);
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  return (
    <div className="driver-location-test">
      <h3>Driver Location Test</h3>
      <p>Test driver location updates for order: <strong>{orderId}</strong></p>
      
      <div className="test-controls">
        <button
          onClick={updateToRandomLocation}
          className="test-btn random-btn"
        >
          <FiMapPin />
          Move to Random Location
        </button>

        {!isSimulating ? (
          <button
            onClick={startSimulation}
            className="test-btn start-btn"
          >
            <FiPlay />
            Start Movement Simulation
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="test-btn stop-btn"
          >
            <FiPause />
            Stop Simulation
          </button>
        )}
      </div>

      {currentLocation && (
        <div className="current-location-display">
          <h4>Current Driver Location:</h4>
          <div className="location-info">
            <FiMapPin />
            <span>{currentLocation.name}</span>
            <span className="coordinates">
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      <div className="test-info">
        <h4>Test Instructions:</h4>
        <ol>
          <li>Click "Move to Random Location" to instantly move driver</li>
          <li>Click "Start Movement Simulation" to simulate driver moving every 5 seconds</li>
          <li>Open the order tracking page in another tab to see real-time updates</li>
          <li>Watch the driver marker move on the map and status updates</li>
        </ol>
      </div>
    </div>
  );
};

export default DriverLocationTest; 