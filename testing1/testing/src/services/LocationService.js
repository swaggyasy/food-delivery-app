import { toast } from 'react-toastify';

class LocationService {
  constructor() {
    this.hasPermission = false;
    this.locationData = null;
  }

  // Request location permission and get coordinates
  async requestLocationPermission() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const successCallback = (position) => {
        const { latitude, longitude } = position.coords;
        this.locationData = { latitude, longitude };
        this.hasPermission = true;
        resolve({ latitude, longitude });
      };

      const errorCallback = (error) => {
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
      };

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    });
  }

  // Reverse geocoding to get address from coordinates
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      console.log('Getting address for coordinates:', latitude, longitude);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address data');
      }

      const data = await response.json();
      console.log('Full API response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      const address = data.address;
      console.log('Address object:', address);
      console.log('Display name:', data.display_name);
      
      let streetAddress;
      const city = address.city || address.town || address.village || address.county || address.state_district || '';

      if (address.road) {
        streetAddress = address.house_number
          ? `${address.house_number} ${address.road}`
          : address.road;
      } else {
        // Fallback to the first part of the display name
        streetAddress = data.display_name.split(',')[0] || '';
      }

      // Avoid using the city name as the street address
      if (streetAddress.trim().toLowerCase() === city.trim().toLowerCase()) {
        streetAddress = ''; // Set to empty if it's just the city name
      }

      const result = {
        address: streetAddress,
        city: city,
        state: address.state || address.province || address.region || '',
        country: address.country || '',
        postcode: address.postcode || '',
        latitude: latitude.toString(),
        longitude: longitude.toString()
      };

      console.log('Final result:', result);
      return result;
      
    } catch (error) {
      console.error('Error getting address:', error);
      // Return basic location data if reverse geocoding fails
      return {
        address: 'Address not available',
        city: '',
        state: '',
        country: '',
        postcode: '',
        latitude: latitude.toString(),
        longitude: longitude.toString()
      };
    }
  }

  // Get location with permission and address
  async getLocationWithAddress() {
    try {
      const coords = await this.requestLocationPermission();
      const addressData = await this.getAddressFromCoordinates(coords.latitude, coords.longitude);
      return addressData;
    } catch (error) {
      throw error;
    }
  }

  // Check if location permission is already granted
  async checkLocationPermission() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }

      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        resolve(result.state === 'granted');
      }).catch(() => {
        resolve(false);
      });
    });
  }

  // Get current location if permission is already granted
  async getCurrentLocation() {
    if (!this.hasPermission) {
      const hasPermission = await this.checkLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }
    }

    return this.getLocationWithAddress();
  }
}

export default new LocationService(); 