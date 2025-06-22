import React, { useState, useEffect, useRef } from 'react';
import { 
  FiPackage, FiClock, FiMapPin, FiPhone, FiUser, 
  FiTruck, FiCheck, FiLoader, FiRefreshCw, FiNavigation,
  FiMessageSquare, FiAlertCircle, FiCalendar, FiStar, FiX
} from 'react-icons/fi';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import { toast } from 'react-toastify';
import { 
  subscribeToOrderUpdates, 
  getOrderTimeline, 
  calculateEstimatedDeliveryTime,
  ORDER_STATUS,
  ORDER_STATUS_DISPLAY,
  ORDER_STATUS_ICONS,
  ORDER_STATUS_COLORS
} from '../services/OrderService';
import webSocketService from '../services/WebSocketService';
import '../styles/OrderTracking.css';

const OrderTracking = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [estimatedDelivery, setEstimatedDelivery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [directions, setDirections] = useState(null);
  const [map, setMap] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverStatus, setDriverStatus] = useState('assigned'); // assigned, on_way, arrived, delivered
  const [eta, setEta] = useState(null);
  const [isDriverMoving, setIsDriverMoving] = useState(false);
  const [lastDriverLocation, setLastDriverLocation] = useState(null);
  const [realTimeEta, setRealTimeEta] = useState(null);

  // Map configuration
  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '12px',
    marginTop: '16px'
  };

  const defaultCenter = {
    lat: 3.1390, // Malaysia center
    lng: 101.6869
  };

  const { isLoaded, loadError } = useGoogleMaps();

  useEffect(() => {
    if (!orderId) return;

    // Subscribe to real-time order updates
    const unsubscribe = subscribeToOrderUpdates(orderId, (orderData) => {
      if (orderData) {
        console.log('OrderTracking - Received order data:', orderData);
        console.log('OrderTracking - Latitude:', orderData.latitude);
        console.log('OrderTracking - Longitude:', orderData.longitude);
        console.log(
          'Driver lat/lng:',
          orderData.deliveryPerson?.currentLocation?.latitude,
          orderData.deliveryPerson?.currentLocation?.longitude
        );
        setOrder(orderData);
        setTimeline(getOrderTimeline(orderData));
        setEstimatedDelivery(calculateEstimatedDeliveryTime(orderData));
        setIsLoading(false);
      } else {
        setError('Order not found');
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  // Calculate directions between driver and customer
  const calculateDirections = () => {
    if (!window.google || !window.google.maps) {
      console.log('Google Maps not loaded');
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    const origin = driverLocation
      ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
      : order?.deliveryPerson?.currentLocation
        ? { lat: order.deliveryPerson.currentLocation.latitude, lng: order.deliveryPerson.currentLocation.longitude }
        : null;

    const destination = order?.latitude && order?.longitude
      ? { lat: order.latitude, lng: order.longitude }
      : null;

    if (!origin || !destination) {
      console.error('Directions calculation skipped: missing origin or destination');
      return;
    }

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          // Extract ETA from directions result
          const leg = result.routes[0]?.legs[0];
          if (leg && leg.duration) {
            setRealTimeEta(leg.duration.text); // e.g., "12 mins"
          } else {
            setRealTimeEta(null);
          }
        } else {
          setDirections(null);
          setRealTimeEta(null);
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  };

  const onMapLoad = (map) => {
    console.log('Map loaded successfully');
    setMap(map);
    setIsMapLoaded(true);
  };

  const onMapUnmount = () => {
    setMap(null);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusProgress = () => {
    if (!order) return 0;
    
    const statusOrder = [
      ORDER_STATUS.PLACED,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.READY_FOR_PICKUP,
      ORDER_STATUS.ASSIGNED_TO_DRIVER,
      ORDER_STATUS.PICKED_UP,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.NEARBY,
      ORDER_STATUS.DELIVERED
    ];

    const currentIndex = statusOrder.indexOf(order.status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const handleCallDriver = () => {
    if (order?.deliveryPerson?.phone) {
      window.open(`tel:${order.deliveryPerson.phone}`, '_self');
    } else {
      toast.error('Driver phone number not available');
    }
  };

  const handleMessageDriver = () => {
    if (order?.deliveryPerson?.phone) {
      window.open(`sms:${order.deliveryPerson.phone}`, '_self');
    } else {
      toast.error('Driver phone number not available');
    }
  };

  // Calculate ETA between two points
  const calculateETA = (origin, destination) => {
    if (!origin || !destination) return null;
    
    const R = 6371; // Earth's radius in km
    const lat1 = origin.latitude * Math.PI / 180;
    const lat2 = destination.latitude * Math.PI / 180;
    const deltaLat = (destination.latitude - origin.latitude) * Math.PI / 180;
    const deltaLon = (destination.longitude - origin.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Assume average speed of 30 km/h for delivery
    const estimatedTime = distance / 30; // Time in hours
    const etaMinutes = Math.round(estimatedTime * 60);
    
    return etaMinutes;
  };

  // Detect if driver is moving
  const detectDriverMovement = (newLocation) => {
    if (!lastDriverLocation || !newLocation) return false;
    
    const R = 6371; // Earth's radius in km
    const lat1 = lastDriverLocation.latitude * Math.PI / 180;
    const lat2 = newLocation.latitude * Math.PI / 180;
    const deltaLat = (newLocation.latitude - lastDriverLocation.latitude) * Math.PI / 180;
    const deltaLon = (newLocation.longitude - lastDriverLocation.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    
    // Consider moving if distance > 50 meters
    return distance > 0.05;
  };

  // Listen for delivery location updates
  useEffect(() => {
    webSocketService.onDeliveryLocationUpdate((data) => {
      if (data.orderId === orderId) {
        console.log('Driver location update received:', data);
        setDriverLocation(data.location);
        
        // Detect movement
        const isMoving = detectDriverMovement(data.location);
        setIsDriverMoving(isMoving);
        
        // Update driver status based on movement
        if (isMoving && driverStatus === 'assigned') {
          setDriverStatus('on_way');
        }
        
        // Calculate ETA if we have delivery address
        if (order?.deliveryAddress) {
          const etaMinutes = calculateETA(data.location, order.deliveryAddress);
          setEta(etaMinutes);
        }
        
        setLastDriverLocation(data.location);
      }
    });
  }, [orderId, order]);

  // Recalculate directions when driver location updates
  useEffect(() => {
    // Only run if map is loaded and order is present
    if (!isMapLoaded || !order) return;

    // Use driverLocation if available, otherwise fallback to order.deliveryPerson.currentLocation
    const origin = driverLocation
      ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
      : order?.deliveryPerson?.currentLocation
        ? { lat: order.deliveryPerson.currentLocation.latitude, lng: order.deliveryPerson.currentLocation.longitude }
        : null;

    const destination = order?.latitude && order?.longitude
      ? { lat: order.latitude, lng: order.longitude }
      : null;

    if (origin && destination && window.google && window.google.maps) {
      calculateDirections();
    }
  }, [driverLocation, order, isMapLoaded]);

  if (isLoading) {
    return (
      <div className="order-tracking-container">
        <div className="tracking-loading">
          <FiLoader className="loading-spinner" />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-tracking-container">
        <div className="tracking-error">
          <FiAlertCircle />
          <p>{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking-container">
        <div className="tracking-error">
          <FiAlertCircle />
          <p>Order not found</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracking-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="tracking-header">
        <div className="tracking-title">
          <FiPackage />
          <h2>Order #{orderId}</h2>
        </div>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      {/* Estimated Delivery */}
      {realTimeEta && (
        <div className="delivery-estimate card-section" style={{ marginBottom: '16px' }}>
          <FiClock />
          <div className="estimate-details">
            <span className="estimate-time">{realTimeEta}</span>
            <span className="estimate-label">Estimated arrival (real-time)</span>
          </div>
        </div>
      )}

      {/* Delivery Person Info (show name above phone number) */}
      <div className="delivery-person" style={{ marginBottom: '16px' }}>
        <div className="driver-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="driver-avatar">
            <FiUser />
          </div>
          <div className="driver-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="driver-name" style={{ color: '#18181b', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1 }}>{order?.deliveryPerson?.name || "Hairol"}</span>
            <span className="driver-phone" style={{ color: '#27272a' }}>{order?.deliveryPerson?.phone || "0142775103"}</span>
          </div>
        </div>
        <div className="driver-actions">
          <a
            href={`tel:${order?.deliveryPerson?.phone || '0142775103'}`}
            className="action-btn call"
            style={{ background: '#2563eb', color: '#fff', textDecoration: 'none' }}
          >
            <FiPhone />
          </a>
          <a
            href={`sms:${order?.deliveryPerson?.phone || '0142775103'}`}
            className="action-btn message"
            style={{ background: '#2563eb', color: '#fff', textDecoration: 'none' }}
          >
            <FiMessageSquare />
          </a>
        </div>
      </div>

      {/* Map */}
      <div className="tracking-map" style={{ marginBottom: '16px' }}>
        {!order.latitude || !order.longitude ? (
          <div className="map-error-fallback">
            <FiMapPin className="map-error-icon" />
            <h4>Location Not Available</h4>
            <p>This order doesn't have location coordinates. The map will appear once delivery location is set.</p>
            {order.address && (
              <div className="location-info">
                <strong>Delivery Address:</strong> {order.address}
              </div>
            )}
          </div>
        ) : loadError ? (
          <div className="map-error-fallback">
            <FiMapPin className="map-error-icon" />
            <h4>Map Unavailable</h4>
            <p>Unable to load Google Maps. Please check your internet connection.</p>
            <div className="location-info">
              <strong>Delivery Address:</strong> {order.address}
              <br />
              <strong>Coordinates:</strong> {order.latitude}, {order.longitude}
            </div>
          </div>
        ) : !isLoaded ? (
          <div className="map-loading">
            <FiLoader className="loading-spinner" />
            <p>Loading map...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={15}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true
            }}
          >
            {/* Customer location marker */}
            {isMapLoaded && window.google && window.google.maps && (
              <Marker
                position={{ lat: order.latitude, lng: order.longitude }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="4" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(24, 24),
                  anchor: new window.google.maps.Point(12, 12)
                }}
                title="Delivery Address"
              />
            )}

            {/* Delivery person location marker */}
            {isMapLoaded && window.google && window.google.maps && (driverLocation || order.deliveryPerson?.currentLocation) && (
              <Marker
                position={{
                  lat: (driverLocation || order.deliveryPerson.currentLocation).latitude,
                  lng: (driverLocation || order.deliveryPerson.currentLocation).longitude
                }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="white" stroke-width="2"/>
                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(24, 24),
                  anchor: new window.google.maps.Point(12, 12)
                }}
                title={`${order.deliveryPerson.name} - Driver ${isDriverMoving ? '(Moving)' : ''}`}
              />
            )}

            {/* Directions */}
            {isMapLoaded && window.google && window.google.maps && directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#3B82F6',
                    strokeWeight: 4
                  }
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {/* Order Details */}
      <div className="order-details" style={{ marginBottom: '0' }}>
        <h3>Order Details</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Order Total</span>
            <span className="detail-value">RM {order.total?.toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Payment Method</span>
            <span className="detail-value">{order.paymentMethod}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Delivery Address</span>
            <span className="detail-value">{order.address}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Items</span>
            <span className="detail-value">{order.items?.length || 0} items</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;