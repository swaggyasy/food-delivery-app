# 🚚 Order Tracking System - GrabFood-like Implementation

A comprehensive real-time order tracking system built with React, Firebase, and WebSocket technology.

## ✨ Features

### 🎯 Core Tracking Features
- **Real-time Order Status Updates** - Live status changes with notifications
- **Interactive Order Timeline** - Visual progress tracking with timestamps
- **Delivery Person Assignment** - Assign and manage delivery drivers
- **Live Location Tracking** - Real-time GPS tracking on Google Maps
- **Estimated Delivery Time** - Dynamic ETA calculations
- **Push Notifications** - Firebase Cloud Messaging integration
- **Order History** - Complete order timeline and status history

### 🗺️ Map Integration
- **Google Maps Integration** - Interactive maps with custom markers
- **Route Visualization** - Real-time delivery routes
- **Location Services** - GPS tracking and geocoding
- **Address Autocomplete** - Smart address input with validation

### 📱 User Experience
- **Mobile Responsive** - Works perfectly on all devices
- **Real-time Updates** - WebSocket-powered live updates
- **Beautiful UI** - Modern, GrabFood-inspired design
- **Dark Mode Support** - Automatic theme detection
- **Accessibility** - Screen reader friendly

## 🏗️ Architecture

### Frontend (React)
```
src/
├── components/
│   └── OrderTracking.js          # Main tracking component
├── services/
│   ├── OrderService.js           # Order management & tracking
│   ├── NotificationService.js    # Push notifications
│   └── WebSocketService.js       # Real-time communication
├── pages/
│   ├── OrdersPage.js             # Customer order list
│   └── admin/AdminOrders.js      # Admin order management
└── styles/
    ├── OrderTracking.css         # Tracking component styles
    ├── OrdersPage.css            # Order page styles
    └── AdminOrders.css           # Admin styles
```

### Backend (WebSocket Server)
```
server/
├── index.js                      # WebSocket server
└── package.json                  # Server dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Frontend dependencies
npm install socket.io-client @react-google-maps/api

# Backend dependencies
cd server
npm install
```

### 2. Start WebSocket Server
```bash
cd server
npm start
```

### 3. Start React App
```bash
npm start
```

### 4. Enable Firebase Cloud Messaging
1. Go to Firebase Console → Your Project
2. Navigate to "Messaging" in the left sidebar
3. Click "Get started" to enable FCM
4. Get your Server Key and Sender ID
5. Add to your environment variables:
   ```
   REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key
   REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_key
   ```

## 📊 Order Status Flow

```
PLACED → CONFIRMED → PREPARING → READY_FOR_PICKUP → 
ASSIGNED_TO_DRIVER → PICKED_UP → OUT_FOR_DELIVERY → 
NEARBY → DELIVERED
```

### Status Descriptions
- **PLACED** - Order received and confirmed
- **CONFIRMED** - Payment confirmed, preparing to cook
- **PREPARING** - Food is being prepared in kitchen
- **READY_FOR_PICKUP** - Order ready for driver pickup
- **ASSIGNED_TO_DRIVER** - Driver assigned to order
- **PICKED_UP** - Driver has picked up the order
- **OUT_FOR_DELIVERY** - Driver is on the way
- **NEARBY** - Driver is close to delivery location
- **DELIVERED** - Order successfully delivered

## 🔧 API Integration

### Order Service Functions
```javascript
// Update order status
await updateOrderStatus(orderId, newStatus, { statusChangeNote: 'Note' });

// Assign delivery person
await assignDeliveryPerson(orderId, {
  name: 'Driver Name',
  phone: '+60123456789',
  vehicle: 'Motorcycle'
});

// Update delivery location
await updateDeliveryLocation(orderId, {
  latitude: 3.1390,
  longitude: 101.6869
});

// Subscribe to real-time updates
const unsubscribe = subscribeToOrderUpdates(orderId, (orderData) => {
  console.log('Order updated:', orderData);
});
```

### WebSocket Events
```javascript
// Listen for updates
webSocketService.onOrderUpdate((data) => {
  console.log('Order updated:', data);
});

webSocketService.onDeliveryLocationUpdate((data) => {
  console.log('Location updated:', data);
});

// Emit updates
webSocketService.emitOrderStatusUpdate(orderId, status, userId);
webSocketService.emitDeliveryLocationUpdate(orderId, location, userId);
```

## 🎨 Customization

### Styling
The tracking system uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #3B82F6;
  --success-color: #10B981;
  --warning-color: #F59E0B;
  --error-color: #EF4444;
  --background-color: #ffffff;
  --text-color: #1f2937;
}
```

### Status Colors & Icons
```javascript
// Customize status colors
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PLACED]: '#3B82F6',
  [ORDER_STATUS.CONFIRMED]: '#10B981',
  // ... add more
};

// Customize status icons
export const ORDER_STATUS_ICONS = {
  [ORDER_STATUS.PLACED]: '🛍️',
  [ORDER_STATUS.CONFIRMED]: '✅',
  // ... add more
};
```

## 🔒 Security Features

- **Firebase Authentication** - Secure user authentication
- **Firestore Rules** - Database security rules
- **Rate Limiting** - API request throttling
- **Input Validation** - Data sanitization
- **CORS Protection** - Cross-origin request security

## 📱 Mobile Optimization

- **Progressive Web App** - Installable on mobile devices
- **Touch-friendly UI** - Optimized for touch interactions
- **Offline Support** - Works without internet connection
- **Push Notifications** - Native mobile notifications
- **GPS Integration** - Location services

## 🧪 Testing

### Manual Testing Checklist
- [ ] Order status updates work correctly
- [ ] Real-time updates appear instantly
- [ ] Map markers show correct locations
- [ ] Push notifications are received
- [ ] Delivery person assignment works
- [ ] Timeline shows all status changes
- [ ] Mobile responsiveness is good
- [ ] Dark mode works properly

### Automated Testing
```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Frontend (Netlify/Vercel)
1. Build the project: `npm run build`
2. Deploy to your hosting platform
3. Set environment variables
4. Configure custom domain

### Backend (Heroku/Railway)
1. Deploy WebSocket server
2. Set environment variables
3. Update frontend WebSocket URL
4. Configure SSL certificates

## 📈 Performance Optimization

- **Lazy Loading** - Components load on demand
- **Image Optimization** - Compressed images and icons
- **Code Splitting** - Smaller bundle sizes
- **Caching** - Browser and service worker caching
- **CDN** - Content delivery network for assets

## 🔧 Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Check if server is running on port 5001
- Verify CORS settings
- Check firewall settings

**Google Maps Not Loading**
- Verify API key is correct
- Check billing is enabled
- Ensure Maps JavaScript API is enabled

**Push Notifications Not Working**
- Check FCM is enabled in Firebase
- Verify VAPID key is correct
- Test notification permissions

**Real-time Updates Not Working**
- Check WebSocket connection status
- Verify user is in correct room
- Check browser console for errors

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Firebase documentation
3. Check WebSocket server logs
4. Test with browser developer tools

## 🎯 Future Enhancements

- [ ] **Voice Notifications** - Audio alerts for status changes
- [ ] **Chat System** - In-app messaging between customer and driver
- [ ] **Payment Integration** - Stripe/PayPal payment processing
- [ ] **Analytics Dashboard** - Order analytics and insights
- [ ] **Multi-language Support** - Internationalization
- [ ] **Advanced Routing** - Traffic-aware route optimization
- [ ] **Driver App** - Separate mobile app for delivery drivers

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using React, Firebase, and WebSocket technology** 