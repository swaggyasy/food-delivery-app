import React, { useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import { FiMapPin, FiAlertCircle, FiCheck } from 'react-icons/fi';

const MapTest = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [testLocation] = useState({
    lat: 3.1390,
    lng: 101.6869
  });

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
  };

  const { isLoaded, loadError } = useGoogleMaps();

  const onMapLoad = () => {
    console.log('Map loaded successfully');
    setMapLoaded(true);
  };

  const onMapError = (error) => {
    console.error('Map loading error:', error);
    setMapError(true);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Google Maps Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results:</h3>
        <ul>
          <li>Map Loaded: {mapLoaded ? '✅ Yes' : '⏳ Loading...'}</li>
          <li>Map Error: {mapError || loadError ? '❌ Yes' : '✅ No'}</li>
        </ul>
      </div>

      {mapError || loadError ? (
        <div style={{ 
          padding: '20px', 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <FiAlertCircle style={{ color: 'red', marginRight: '8px' }} />
          <strong>Map Loading Failed</strong>
          <p>Check your internet connection and API key configuration.</p>
          {loadError && <p>Error: {loadError.message}</p>}
        </div>
      ) : (
        <div style={{ 
          padding: '20px', 
          background: '#efe', 
          border: '1px solid #cfc',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <FiCheck style={{ color: 'green', marginRight: '8px' }} />
          <strong>Map Loading Successfully</strong>
          <p>Google Maps is working correctly.</p>
        </div>
      )}

      <div style={{ border: '2px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={testLocation}
            zoom={15}
            onLoad={onMapLoad}
            onError={onMapError}
            options={{
              zoomControl: true,
              streetViewControl: true,
              mapTypeControl: true,
              fullscreenControl: true
            }}
          >
            <Marker
              position={testLocation}
              title="Test Location"
            />
          </GoogleMap>
        ) : (
          <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <h4>Debug Information:</h4>
            <p><strong>Test Location:</strong> {testLocation.lat}, {testLocation.lng}</p>
            <p>Map script is loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapTest; 