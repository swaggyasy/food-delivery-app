import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  Timestamp,
  getDoc,
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';
import { createNotification, NOTIFICATION_TYPES } from './NotificationService';

// Order status constants
export const ORDER_STATUS = {
  PLACED: 'PLACED',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  ASSIGNED_TO_DRIVER: 'ASSIGNED_TO_DRIVER',
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  NEARBY: 'NEARBY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

// Order status display names
export const ORDER_STATUS_DISPLAY = {
  [ORDER_STATUS.PLACED]: 'Order Placed',
  [ORDER_STATUS.CONFIRMED]: 'Order Confirmed',
  [ORDER_STATUS.PREPARING]: 'Preparing Your Order',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'Ready for Pickup',
  [ORDER_STATUS.ASSIGNED_TO_DRIVER]: 'Driver Assigned',
  [ORDER_STATUS.PICKED_UP]: 'Picked Up by Driver',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUS.NEARBY]: 'Driver is Nearby',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled'
};

// Order status icons
export const ORDER_STATUS_ICONS = {
  [ORDER_STATUS.PLACED]: '🛍️',
  [ORDER_STATUS.CONFIRMED]: '✅',
  [ORDER_STATUS.PREPARING]: '👨‍🍳',
  [ORDER_STATUS.READY_FOR_PICKUP]: '📦',
  [ORDER_STATUS.ASSIGNED_TO_DRIVER]: '🚗',
  [ORDER_STATUS.PICKED_UP]: '📱',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: '🛵',
  [ORDER_STATUS.NEARBY]: '📍',
  [ORDER_STATUS.DELIVERED]: '🎉',
  [ORDER_STATUS.CANCELLED]: '❌'
};

// Order status colors
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PLACED]: '#3B82F6',
  [ORDER_STATUS.CONFIRMED]: '#10B981',
  [ORDER_STATUS.PREPARING]: '#F59E0B',
  [ORDER_STATUS.READY_FOR_PICKUP]: '#8B5CF6',
  [ORDER_STATUS.ASSIGNED_TO_DRIVER]: '#06B6D4',
  [ORDER_STATUS.PICKED_UP]: '#EC4899',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: '#F97316',
  [ORDER_STATUS.NEARBY]: '#EF4444',
  [ORDER_STATUS.DELIVERED]: '#059669',
  [ORDER_STATUS.CANCELLED]: '#6B7280'
};

// Create a new order
export const createOrder = async (userId, orderData) => {
  try {
    // Create the order in Firestore
    const order = {
      userId,
      ...orderData,
      status: ORDER_STATUS.PLACED,
      createdAt: Timestamp.now()
    };

    const orderRef = await addDoc(collection(db, 'orders'), order);
    const orderId = orderRef.id;

    // Send order placed notification
    await createNotification(userId, NOTIFICATION_TYPES.ORDER_PLACED, {
      orderId
    });

    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, newStatus, additionalData = {}) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    const updateData = {
      status: newStatus,
      updatedAt: Timestamp.now(),
      ...additionalData
    };

    // Add status change to timeline
    if (additionalData.statusChangeNote) {
      updateData.statusTimeline = arrayUnion({
        status: newStatus,
        timestamp: Timestamp.now(),
        note: additionalData.statusChangeNote
      });
    }

    await updateDoc(orderRef, updateData);

    // Get order data for notification
    const orderDoc = await getDoc(orderRef);
    const orderData = orderDoc.data();

    // Send notification based on status
    if (orderData.userId) {
      await createNotification(orderData.userId, `ORDER_${newStatus}`, {
        orderId,
        status: newStatus,
        ...additionalData
      });
    }

    return { success: true, orderId, newStatus };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Assign delivery person to order
export const assignDeliveryPerson = async (orderId, deliveryPersonData) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      deliveryPerson: {
        id: deliveryPersonData.id,
        name: deliveryPersonData.name,
        phone: deliveryPersonData.phone,
        vehicle: deliveryPersonData.vehicle || 'Motorcycle',
        assignedAt: Timestamp.now()
      },
      status: ORDER_STATUS.ASSIGNED_TO_DRIVER,
      updatedAt: Timestamp.now()
    });

    // Get order data for notification
    const orderDoc = await getDoc(orderRef);
    const orderData = orderDoc.data();

    // Send notification
    if (orderData.userId) {
      await createNotification(orderData.userId, 'DRIVER_ASSIGNED', {
        orderId,
        driverName: deliveryPersonData.name,
        driverPhone: deliveryPersonData.phone
      });
    }

    return { success: true, orderId, deliveryPerson: deliveryPersonData };
  } catch (error) {
    console.error('Error assigning delivery person:', error);
    throw error;
  }
};

// Update delivery person location
export const updateDeliveryLocation = async (orderId, location) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      'deliveryPerson.currentLocation': {
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: Timestamp.now()
      },
      updatedAt: Timestamp.now()
    });

    return { success: true, orderId, location };
  } catch (error) {
    console.error('Error updating delivery location:', error);
    throw error;
  }
};

// Get real-time order updates
export const subscribeToOrderUpdates = (orderId, callback) => {
  const orderRef = doc(db, 'orders', orderId);
  
  return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      const orderData = doc.data();
      callback({
        id: doc.id,
        ...orderData,
        createdAt: orderData.createdAt?.toDate?.() || new Date(),
        updatedAt: orderData.updatedAt?.toDate?.() || new Date()
      });
    } else {
      callback(null);
    }
  });
};

// Get order timeline
export const getOrderTimeline = (order) => {
  const timeline = [];
  
  // Add order creation
  if (order.createdAt) {
    timeline.push({
      status: ORDER_STATUS.PLACED,
      timestamp: order.createdAt,
      title: 'Order Placed',
      description: 'Your order has been successfully placed',
      icon: ORDER_STATUS_ICONS[ORDER_STATUS.PLACED],
      color: ORDER_STATUS_COLORS[ORDER_STATUS.PLACED]
    });
  }

  // Add status timeline if exists
  if (order.statusTimeline && Array.isArray(order.statusTimeline)) {
    order.statusTimeline.forEach(statusChange => {
      timeline.push({
        status: statusChange.status,
        timestamp: statusChange.timestamp?.toDate?.() || new Date(statusChange.timestamp),
        title: ORDER_STATUS_DISPLAY[statusChange.status] || statusChange.status,
        description: statusChange.note || `Order is now ${statusChange.status.toLowerCase()}`,
        icon: ORDER_STATUS_ICONS[statusChange.status] || '📋',
        color: ORDER_STATUS_COLORS[statusChange.status] || '#6B7280'
      });
    });
  }

  // Add current status if not in timeline
  const currentStatusInTimeline = timeline.some(item => item.status === order.status);
  if (!currentStatusInTimeline && order.status) {
    timeline.push({
      status: order.status,
      timestamp: order.updatedAt || order.createdAt,
      title: ORDER_STATUS_DISPLAY[order.status] || order.status,
      description: `Order is currently ${order.status.toLowerCase()}`,
      icon: ORDER_STATUS_ICONS[order.status] || '📋',
      color: ORDER_STATUS_COLORS[order.status] || '#6B7280'
    });
  }

  // Sort by timestamp
  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Calculate estimated delivery time
export const calculateEstimatedDeliveryTime = (order) => {
  if (!order.createdAt) return null;

  const orderTime = new Date(order.createdAt);
  const now = new Date();
  const timeDiff = now - orderTime;
  const minutesDiff = Math.floor(timeDiff / (1000 * 60));

  // Base delivery time: 30-45 minutes
  let estimatedMinutes = 35;
  
  // Adjust based on current status
  switch (order.status) {
    case ORDER_STATUS.PLACED:
      estimatedMinutes = 45;
      break;
    case ORDER_STATUS.CONFIRMED:
      estimatedMinutes = 40;
      break;
    case ORDER_STATUS.PREPARING:
      estimatedMinutes = 30;
      break;
    case ORDER_STATUS.READY_FOR_PICKUP:
      estimatedMinutes = 25;
      break;
    case ORDER_STATUS.ASSIGNED_TO_DRIVER:
      estimatedMinutes = 20;
      break;
    case ORDER_STATUS.PICKED_UP:
      estimatedMinutes = 15;
      break;
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      estimatedMinutes = 10;
      break;
    case ORDER_STATUS.NEARBY:
      estimatedMinutes = 5;
      break;
    case ORDER_STATUS.DELIVERED:
      estimatedMinutes = 0;
      break;
    default:
      estimatedMinutes = 35;
  }

  const estimatedTime = new Date(now.getTime() + (estimatedMinutes * 60 * 1000));
  
  return {
    estimatedMinutes,
    estimatedTime,
    isDelivered: order.status === ORDER_STATUS.DELIVERED
  };
};

// Example usage in your components:
/*
// When creating a new order:
const orderId = await createOrder(userId, {
  items: cartItems,
  totalAmount: 99.99,
  shippingAddress: address
});

// When updating order status:
// For shipping
await updateOrderStatus(orderId, ORDER_STATUS.SHIPPED, {
  trackingNumber: 'TRACK123'
});

// For cancellation
await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, {
  cancelReason: 'Out of stock'
});
*/ 