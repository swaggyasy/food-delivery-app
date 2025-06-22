import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { FiUser, FiMapPin, FiCreditCard, FiAlertCircle, FiCheck, FiSearch } from 'react-icons/fi';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import { sendOrderNotification } from '../utils/telegramNotifications';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import '../styles/CheckoutPage.css';

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  marginTop: '10px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: 3.1390, // Default to Malaysia's approximate center
  lng: 101.6869
};

// Add search box options
const searchBoxOptions = {
  componentRestrictions: { country: 'my' }, // Restrict to Malaysia
  fields: ['address_components', 'geometry', 'formatted_address', 'name', 'place_id'],
  types: ['geocode', 'establishment', 'address'],
  strictBounds: false
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useCart();
  const searchInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const [isProcessing, setIsProcessing] = useState(false);
  const [map, setMap] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
  const [mapError, setMapError] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState([]);

  const { isLoaded, loadError } = useGoogleMaps();

  useEffect(() => {
    // Get cart items from localStorage
    const pendingCart = localStorage.getItem('pendingCart');
    if (pendingCart) {
      setCartItems(JSON.parse(pendingCart));
    } else {
      // If no pending cart, use the cart state
      setCartItems(state.items);
    }
  }, [state.items]);

  const [formData, setFormData] = useState({
    fullName: currentUser.name || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    address: currentUser.address || '',
    city: currentUser.city || '',
    paymentMethod: 'Cash on Delivery',
    deliveryMethod: 'delivery',
    latitude: null,
    longitude: null,
  });

  const onLoadError = (error) => {
    console.error('Google Maps loading error:', error);
    setMapError(true);
    toast.error('Unable to load Google Maps. Please check your internet connection or try again later.');
  };

  const onLoad = useCallback((map) => {
    console.log('Map loaded successfully');
    setMap(map);
    setIsMapLoaded(true);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onLoadAutocomplete = (auto) => {
    console.log('Autocomplete loaded successfully');
    if (auto) {
      setAutocomplete(auto);
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null && window.google && window.google.maps) {
      const place = autocomplete.getPlace();
      console.log('Selected place:', place);

      // If we don't have geometry, try to geocode the address
      if (!place.geometry) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: place.name || place.formatted_address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();

            setSelectedLocation({ lat, lng });
            if (map) {
              map.panTo({ lat, lng });
              map.setZoom(17);
            }

            // Update form with geocoded address
            updateFormWithAddress(results[0]);
          } else {
            console.error('Geocoding failed:', status);
            toast.error('Could not find the exact location. Please try to be more specific or use the map.');
          }
        });
        return;
      }

      // If we have geometry, proceed normally
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      setSelectedLocation({ lat, lng });
      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(17);
      }

      updateFormWithAddress(place);
    }
  };

  const updateFormWithAddress = (place) => {
    if (!place.address_components) {
      // If we don't have address components, just use the formatted address
      setFormData(prev => ({
        ...prev,
        address: place.formatted_address || place.name,
        city: '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      }));
      return;
    }

    let streetNumber = '';
    let route = '';
    let area = '';
    let city = '';
    let state = '';
    let postalCode = '';

    place.address_components.forEach(component => {
      const types = component.types;
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        route = component.long_name;
      }
      if (types.includes('sublocality_level_1')) {
        area = component.long_name;
      }
      if (types.includes('locality') || types.includes('sublocality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    });

    // Construct address with all available components
    const addressParts = [];
    if (streetNumber) addressParts.push(streetNumber);
    if (route) addressParts.push(route);
    if (area) addressParts.push(area);
    
    const formattedAddress = addressParts.join(' ') || place.formatted_address || place.name;
    
    // Construct city with all available components
    const cityParts = [];
    if (city) cityParts.push(city);
    if (state) cityParts.push(state);
    if (postalCode) cityParts.push(postalCode);
    
    const formattedCity = cityParts.join(', ');

    setFormData(prev => ({
      ...prev,
      address: formattedAddress,
      city: formattedCity,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng()
    }));
  };

  const onMapClick = (event) => {
    if (window.google && window.google.maps) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setSelectedLocation({ lat, lng });
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const place = results[0];

          // Helper to safely extract all parts of the address
          const getAddressComponent = (type, components) => {
            const component = components.find(c => c.types.includes(type));
            return component ? component.long_name : '';
          };
          
          if (!place.address_components) {
              // Fallback if no detailed components are found
              setFormData(prev => ({
                ...prev,
                address: place.formatted_address || '',
                city: '',
                latitude: lat,
                longitude: lng
              }));
              return;
          }

          const components = place.address_components;
          const streetNumber = getAddressComponent('street_number', components);
          const route = getAddressComponent('route', components);
          const neighborhood = getAddressComponent('neighborhood', components);
          const sublocality = getAddressComponent('sublocality_level_1', components);
          const city = getAddressComponent('locality', components);
          const state = getAddressComponent('administrative_area_level_1', components);
          const postalCode = getAddressComponent('postal_code', components);
        
          // Combine the components into a full, detailed address
          const streetAddress = `${streetNumber} ${route}`.trim();
          const area = neighborhood || sublocality;
          const fullAddress = [streetAddress, area].filter(Boolean).join(', ');
          const fullCityInfo = [city, state, postalCode].filter(Boolean).join(', ');

          setFormData(prev => ({
            ...prev,
            address: fullAddress || place.formatted_address || '',
            city: fullCityInfo,
            latitude: lat,
            longitude: lng
          }));
        } else {
          console.error('Reverse geocoding failed:', status);
          toast.error('Could not determine the address for this location.');
        }
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'deliveryMethod') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(value === 'pickup' ? { address: '', city: '' } : {}),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFindOnMap = () => {
    const fullAddress = `${formData.address}, ${formData.city}`;
    if (!formData.address) {
      toast.error('Please enter an address to find on the map.');
      return;
    }
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: fullAddress, componentRestrictions: { country: 'my' } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          setSelectedLocation({ lat, lng });
          if (map) {
            map.panTo({ lat, lng });
            map.setZoom(17);
          }
          updateFormWithAddress(results[0]);
        } else {
          console.error('Geocoding failed for manual address:', status);
          toast.error('Could not find that address. Please try to be more specific.');
        }
      });
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateDeliveryFee = () => {
    return formData.deliveryMethod === 'delivery' ? 10 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.paymentMethod === 'Online Payment') {
      // For online payments, we first redirect to payment gateway
      // The order will be created via webhook after successful payment
      try {
        setIsProcessing(true);
        const totalAmount = calculateTotal();

        // Store order details in local storage to be retrieved after payment
        const orderDetails = {
          userEmail: currentUser.email,
          customerName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.address}, ${formData.city}`,
          latitude: formData.latitude,
          longitude: formData.longitude,
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: calculateSubtotal(),
          deliveryFee: calculateDeliveryFee(),
          total: totalAmount,
          deliveryType: formData.deliveryMethod,
          paymentMethod: formData.paymentMethod,
          status: 'pending_payment', // A new status
          date: new Date().toISOString(),
          createdAt: serverTimestamp(),
          userId: currentUser.uid,
        };
        
        // Save to local storage
        localStorage.setItem('pending_order', JSON.stringify(orderDetails));

        // Create a bill with ToyyibPay
        const response = await fetch('http://localhost:5000/api/toyyibpay/create-bill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Pass a reference or the total amount to the backend
            // The backend will create a bill with a unique ID
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            amount: totalAmount,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Redirect to payment gateway
          window.location.href = `https://toyyibpay.com/${result.billCode}`;
        } else {
          throw new Error(result.message || 'Failed to create payment bill');
        }

      } catch (error) {
        console.error('Error initiating online payment:', error);
        toast.error('Could not initiate online payment. Please try again.');
        setIsProcessing(false);
      }

    } else {
      // For other payment methods like COD, we create the order directly
      try {
        setIsProcessing(true);
        const orderData = {
          userEmail: currentUser.email,
          customerName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.address}, ${formData.city}`,
          latitude: formData.latitude,
          longitude: formData.longitude,
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: calculateSubtotal(),
          deliveryFee: calculateDeliveryFee(),
          total: calculateTotal(),
          deliveryType: formData.deliveryMethod,
          paymentMethod: formData.paymentMethod,
          status: 'pending',
          date: new Date().toISOString(),
          createdAt: serverTimestamp(),
          userId: currentUser.uid,
        };

        const ordersRef = collection(db, 'orders');
        const docRef = await addDoc(ordersRef, orderData);
        orderData.id = docRef.id;

        // Send notification
        await sendOrderNotification(orderData);
        
        // Clear cart and navigate
        dispatch({ type: 'CLEAR_CART' });
        toast.success('Order placed successfully!');
        navigate('/dashboard/orders');

      } catch (error) {
        console.error('Error placing order:', error);
        toast.error('Failed to place order. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      
      <div className="checkout-progress">
        <div className={`progress-line`}>
          <div 
            className="progress-line-fill" 
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          />
        </div>
        
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 1 ? <FiCheck /> : 1}
          </div>
          <div className="step-label">Personal Info</div>
        </div>
        
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 2 ? <FiCheck /> : 2}
          </div>
          <div className="step-label">Delivery</div>
        </div>
        
        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">
            {currentStep > 3 ? <FiCheck /> : 3}
          </div>
          <div className="step-label">Payment</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Information Section */}
        <div className="form-section" onChange={() => setCurrentStep(1)}>
          <h3>
            <FiUser /> Personal Information
          </h3>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        {/* Delivery Information Section */}
        <div className="form-section" onChange={() => setCurrentStep(2)}>
          <h3>
            <FiMapPin /> Delivery Information
          </h3>
          <select
            name="deliveryMethod"
            value={formData.deliveryMethod}
            onChange={handleChange}
            className="delivery-method-select"
          >
            <option value="delivery">Home Delivery (RM 10)</option>
            <option value="pickup">Store Pickup (Free)</option>
          </select>
          {formData.deliveryMethod === 'delivery' && (
            <div className="address-section">
              {loadError ? (
                <div className="maps-error-message">
                  <FiAlertCircle />
                  <p>Unable to load Google Maps. Please check your internet connection or try again later.</p>
                </div>
              ) : !isLoaded ? (
                <div className="maps-loading-message">
                  <p>Loading map...</p>
                </div>
              ) : (
                <>
                  <div className="autocomplete-container">
                    <Autocomplete
                      onLoad={onLoadAutocomplete}
                      onPlaceChanged={onPlaceChanged}
                      options={searchBoxOptions}
                    >
                      <input
                        type="text"
                        placeholder="Search your address..."
                        className="address-input"
                        value={formData.address}
                        onChange={handleChange}
                        name="address"
                      />
                    </Autocomplete>
                  </div>
                  <input
                    type="text"
                    name="city"
                    placeholder="City, State, Postal Code"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" onClick={handleFindOnMap} className="find-on-map-btn">
                    Find Address on Map
                  </button>
                  <div className="map-container">
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={selectedLocation}
                      zoom={15}
                      onLoad={onLoad}
                      onUnmount={onUnmount}
                      onClick={onMapClick}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                        zoomControl: true
                      }}
                    >
                      {isMapLoaded && (
                        <Marker
                          position={selectedLocation}
                          draggable={true}
                          onDragEnd={(e) => {
                            onMapClick({
                              latLng: {
                                lat: () => e.latLng.lat(),
                                lng: () => e.latLng.lng()
                              }
                            });
                          }}
                        />
                      )}
                    </GoogleMap>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Payment Method Section */}
        <div className="form-section" onChange={() => setCurrentStep(3)}>
          <h3>
            <FiCreditCard /> Payment Method
          </h3>
          <div className="payment-method-options">
            <div 
              className={`payment-method-option ${formData.paymentMethod === 'Online Payment' ? 'selected' : ''}`}
              onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'Online Payment' } })}
            >
              <FiCreditCard />
              <div>Online Payment</div>
            </div>
            <div 
              className={`payment-method-option ${formData.paymentMethod === 'Cash on Delivery' ? 'selected' : ''}`}
              onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'Cash on Delivery' } })}
            >
              <FiCreditCard />
              <div>Cash on Delivery</div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isProcessing}
          onClick={() => setCurrentStep(3)}
        >
          {isProcessing
            ? 'Processing...'
            : `Place Order (RM ${calculateTotal().toFixed(2)})`}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
