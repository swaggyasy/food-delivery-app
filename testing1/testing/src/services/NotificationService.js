import { toast } from 'react-toastify';
import { db, auth } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Notification types
export const NOTIFICATION_TYPES = {
  ORDER_PLACED: 'ORDER_PLACED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_PREPARING: 'ORDER_PREPARING',
  ORDER_READY_FOR_PICKUP: 'ORDER_READY_FOR_PICKUP',
  ORDER_ASSIGNED_TO_DRIVER: 'ORDER_ASSIGNED_TO_DRIVER',
  ORDER_PICKED_UP: 'ORDER_PICKED_UP',
  ORDER_OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
  ORDER_NEARBY: 'ORDER_NEARBY',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED'
};

// Notification templates
const notificationTemplates = {
  [NOTIFICATION_TYPES.ORDER_PLACED]: {
    title: 'Order Received',
    message: 'Thank you for your order! Order #{orderId} has been received.',
    icon: '🛍️'
  },
  [NOTIFICATION_TYPES.ORDER_CONFIRMED]: {
    title: 'Order Confirmed',
    message: 'Your order #{orderId} has been confirmed and is being prepared.',
    icon: '✅'
  },
  [NOTIFICATION_TYPES.ORDER_PREPARING]: {
    title: 'Preparing Your Order',
    message: 'Your order #{orderId} is being prepared in the kitchen.',
    icon: '👨‍🍳'
  },
  [NOTIFICATION_TYPES.ORDER_READY_FOR_PICKUP]: {
    title: 'Ready for Pickup',
    message: 'Your order #{orderId} is ready and waiting for pickup.',
    icon: '📦'
  },
  [NOTIFICATION_TYPES.ORDER_ASSIGNED_TO_DRIVER]: {
    title: 'Driver Assigned',
    message: 'A driver has been assigned to deliver your order #{orderId}.',
    icon: '🚗'
  },
  [NOTIFICATION_TYPES.ORDER_PICKED_UP]: {
    title: 'Order Picked Up',
    message: 'Your order #{orderId} has been picked up and is on the way!',
    icon: '📱'
  },
  [NOTIFICATION_TYPES.ORDER_OUT_FOR_DELIVERY]: {
    title: 'Out for Delivery',
    message: 'Your order #{orderId} is out for delivery and heading to you.',
    icon: '🛵'
  },
  [NOTIFICATION_TYPES.ORDER_NEARBY]: {
    title: 'Driver is Nearby',
    message: 'Your driver is nearby! Order #{orderId} will be delivered soon.',
    icon: '📍'
  },
  [NOTIFICATION_TYPES.ORDER_DELIVERED]: {
    title: 'Order Delivered',
    message: 'Your order #{orderId} has been delivered. Enjoy your meal!',
    icon: '🎉'
  },
  [NOTIFICATION_TYPES.ORDER_CANCELLED]: {
    title: 'Order Cancelled',
    message: 'Order #{orderId} has been cancelled.',
    icon: '❌'
  },
  [NOTIFICATION_TYPES.DRIVER_ASSIGNED]: {
    title: 'Driver Assigned',
    message: 'Driver {driverName} is assigned to your order #{orderId}. Call: {driverPhone}',
    icon: '🚗'
  }
};

// Initialize FCM
let messaging;
export const initializePushNotifications = async () => {
  try {
    messaging = getMessaging();
    
    // Request permission and get token
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });

      // Save the token to the user's document in Firestore
      if (token) {
        const userId = auth.currentUser?.uid;
        if (userId) {
          await updateDoc(doc(db, 'users', userId), {
            fcmToken: token
          });
        }
      }

      return token;
    }
    
    throw new Error('Notification permission denied');
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    throw error;
  }
};

// Listen for foreground messages
export const onPushNotification = (callback) => {
  if (!messaging) return;

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

// Create and send notification
export const createNotification = async (userId, type, data) => {
  try {
    const template = notificationTemplates[type];
    if (!template) throw new Error('Invalid notification type');

    let message = template.message;
    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      message = message.replace(`{${key}}`, data[key]);
    });

    const notification = {
      userId,
      type,
      title: template.title,
      message,
      icon: template.icon,
      data,
      isRead: false,
      createdAt: Timestamp.now()
    };

    // Save notification to database
    await addDoc(collection(db, 'notifications'), notification);

    // Show toast notification if user is online
    toast(message, {
      icon: template.icon,
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });

    // Get user data for FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Send push notification if user has FCM token
    if (userData.fcmToken) {
      // Use Firebase Cloud Function to send push notification
      const functions = getFunctions();
      const sendPushNotification = httpsCallable(functions, 'sendPushNotification');
      
      await sendPushNotification({
        token: userData.fcmToken,
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          url: data.orderId ? `/orders/${data.orderId}` : '/orders'
        }
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Subscribe to user notifications
export const subscribeToNotifications = (userId, callback) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = [];
    snapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(notifications);
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Function to send order status notification
export const sendOrderStatusNotification = async (orderId, status) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Create notification data
    const notification = {
      title: `Order Status Update`,
      body: `Order #${orderId} is now ${status}`,
      timestamp: Timestamp.now(),
      userId: currentUser.uid,
      orderId,
      status,
      read: false
    };

    // Add notification to Firestore
    await addDoc(collection(db, 'notifications'), notification);

    // Show toast notification if user is in the app
    toast.info(`${notification.title}: ${notification.body}`);

  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}; 