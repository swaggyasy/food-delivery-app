# 🗺️ Google Maps Testing Guide

This guide helps you test the Google Maps integration in the application. The application now uses a centralized `GoogleMapsProvider` to load the Google Maps API, which improves reliability.

## Quick Test

1. **Start your React app** (if not already running):
   ```bash
   cd testing1/testing
   npm start
   ```

2. **Visit the map test page**:
   Open your browser and go to `http://localhost:3000/map-test`. The test page is not in the main navigation and needs to be accessed directly.

3. **Check the results**:
   - ✅ **Map Loaded**: Should show "Yes" after a few seconds.
   - ✅ **Map Error**: Should show "No".
   - A map of Malaysia with a pin should be visible.

## Troubleshooting

If the map doesn't load, follow these steps:

### 1. Check Browser Console
- Open Developer Tools (F12 or Ctrl+Shift+I).
- Look for errors in the **Console** tab.
- Common errors include:
  - `Google Maps JavaScript API error: ApiNotActivatedMapError`
  - `Google Maps JavaScript API error: RefererNotAllowedMapError`
  - `Google Maps JavaScript API error: InvalidKeyMapError`

### 2. Check API Key Configuration
- The Google Maps API key is configured in `testing1/testing/src/context/GoogleMapsContext.js`.
- For development, it's recommended to use a `.env` file in the `testing1/testing` directory:
  ```
  REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
  ```
- Ensure the key is correct and has the necessary APIs enabled.

### 3. Check Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project.
3. Navigate to **APIs & Services → Enabled APIs**.
4. Make sure these APIs are **enabled**:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API**

### 4. Check Billing
1. Go to **Billing** in the Google Cloud Console.
2. Ensure that billing is enabled for your project.
3. Check if your billing account is active and has a valid payment method.

### 5. Check API Key Restrictions
1. Go to **APIs & Services → Credentials**.
2. Click on your API key to edit its settings.
3. **Application restrictions**:
   - If you've set "HTTP referrers", make sure to add `http://localhost:3000/*` to the list of allowed referrers.
   - For initial testing, you can set this to "None", but it's not recommended for production.
4. **API restrictions**:
   - Ensure that "Maps JavaScript API", "Geocoding API", and "Places API" are included in the list of allowed APIs.

## Testing Functionality

### Checkout Page
1. Add an item to your cart and proceed to checkout.
2. On the checkout page, you should see a map and an address search bar.
3. **Test the autocomplete**: Start typing an address in the search bar. You should see suggestions from Google Maps.
4. **Test map interaction**: Click on the map to select a location. The address fields should update accordingly.

### Order Tracking
1. Create a test order with a delivery address.
2. Go to the "Orders" page and click "Track" on your order.
3. The order tracking modal should display a map with the delivery location and (if available) the driver's current location.

## Testing Order Tracking

### 1. Create a Test Order
1. Go to your app and create a new order
2. Make sure to select "Home Delivery"
3. Use the map to set a delivery location
4. Complete the checkout

### 2. Test Order Tracking
1. Go to Orders page
2. Click "Track" on your order
3. You should see:
   - Order status progress
   - Map with delivery location marker
   - Order timeline

### 3. Test Admin Features
1. Go to Admin Orders
2. Click "Track" on an order
3. Click "Assign Driver" to assign a delivery person
4. Update order status

## Common Issues & Solutions

### Issue: "Maps JavaScript API error: ApiNotActivatedMapError"
**Solution**: Enable Maps JavaScript API in Google Cloud Console

### Issue: "Maps JavaScript API error: RefererNotAllowedMapError"
**Solution**: Add `localhost:3000` to allowed referrers in API key settings

### Issue: "Maps JavaScript API error: BillingNotEnabledMapError"
**Solution**: Enable billing for your Google Cloud project

### Issue: Map loads but no markers appear
**Solution**: Check if order has latitude/longitude coordinates

### Issue: Map shows but is gray/empty
**Solution**: Check internet connection and API key validity

## Debug Information

### Check Order Data
In the browser console, look for:
```
OrderTracking - Received order data: {...}
OrderTracking - Latitude: 3.1390
OrderTracking - Longitude: 101.6869
```

### Check Map Loading
Look for:
```
Map loaded successfully
```

### Check for Errors
Look for:
```
Google Maps loading error: ...
```

## Environment Variables

Make sure these are set in your `.env` file:
```
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCcfa5vrRs-idWeALYqwAPaaWdfFerXrOE
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key_here
```

## API Key Security

⚠️ **Important**: The API key in this test is for development only. For production:

1. Create a new API key
2. Set proper restrictions:
   - HTTP referrers: your domain only
   - API restrictions: only needed APIs
3. Monitor usage in Google Cloud Console

## Support

If you're still having issues:

1. Check the browser console for specific error messages
2. Verify your Google Cloud Console settings
3. Test with the `/map-test` route first
4. Make sure your internet connection is stable

---

**Test URL**: `http://localhost:3000/map-test` 