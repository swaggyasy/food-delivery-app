import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  // Connect to WebSocket server
  connect(userId = null, isAdmin = false) {
    try {
      // Disconnect existing connection if any
      if (this.socket) {
        this.socket.disconnect();
      }

      // Connect to WebSocket server using environment variable or fallback
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      this.socket = io(SOCKET_URL);

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Join appropriate room
        if (isAdmin) {
          this.socket.emit('join-admin-room');
          console.log('Joined admin room');
        } else if (userId) {
          this.socket.emit('join-user-room', userId);
          console.log(`Joined user room: ${userId}`);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectDelay *= 2; // Exponential backoff
            this.connect(userId, isAdmin);
          }, this.reconnectDelay);
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Rejoin room after reconnection
        if (isAdmin) {
          this.socket.emit('join-admin-room');
        } else if (userId) {
          this.socket.emit('join-user-room', userId);
        }
      });

      this.socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnected = false;
    }
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Listen for order updates
  onOrderUpdate(callback) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.on('order-updated', (data) => {
      console.log('Order update received:', data);
      callback(data);
    });
  }

  // Listen for delivery location updates
  onDeliveryLocationUpdate(callback) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.on('delivery-location-updated', (data) => {
      console.log('Delivery location update received:', data);
      callback(data);
    });
  }

  // Listen for delivery person assignment
  onDeliveryAssigned(callback) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.on('delivery-assigned', (data) => {
      console.log('Delivery assignment received:', data);
      callback(data);
    });
  }

  // Emit order status update
  emitOrderStatusUpdate(orderId, status, userId) {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected');
      return false;
    }

    this.socket.emit('order-status-update', {
      orderId,
      status,
      userId,
      timestamp: new Date()
    });

    return true;
  }

  // Emit delivery location update
  emitDeliveryLocationUpdate(orderId, location, userId) {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected');
      return false;
    }

    this.socket.emit('delivery-location-update', {
      orderId,
      location,
      userId,
      timestamp: new Date()
    });

    return true;
  }

  // Emit delivery person assignment
  emitDeliveryAssigned(orderId, deliveryPerson, userId) {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected');
      return false;
    }

    this.socket.emit('delivery-assigned', {
      orderId,
      deliveryPerson,
      userId,
      timestamp: new Date()
    });

    return true;
  }

  // Remove event listeners
  removeListener(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null
    };
  }

  // Health check
  async healthCheck() {
    try {
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      const response = await fetch(`${SOCKET_URL}/api/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'ERROR', error: error.message };
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService; 