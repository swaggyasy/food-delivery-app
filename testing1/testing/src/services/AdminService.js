import { db } from '../firebase/config';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

// Announcements
export const createAnnouncement = async (announcementData) => {
  try {
    const announcementsRef = collection(db, 'announcements');
    const docRef = await addDoc(announcementsRef, {
      ...announcementData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...announcementData };
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

export const updateAnnouncement = async (announcementId, updateData) => {
  try {
    const announcementRef = doc(db, 'announcements', announcementId);
    await updateDoc(announcementRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { id: announcementId, ...updateData };
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

// Products
export const createProduct = async (productData) => {
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...productData };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, updateData) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { id: productId, ...updateData };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// User Feedback
export const createFeedback = async (feedbackData) => {
  try {
    const feedbackRef = collection(db, 'feedbacks');
    const docRef = await addDoc(feedbackRef, {
      ...feedbackData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...feedbackData };
  } catch (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }
};

export const respondToFeedback = async (feedbackId, adminResponse) => {
  try {
    const feedbackRef = doc(db, 'feedbacks', feedbackId);
    await updateDoc(feedbackRef, {
      adminResponse: {
        ...adminResponse,
        respondedAt: serverTimestamp()
      },
      status: 'reviewed',
      updatedAt: serverTimestamp()
    });
    return { id: feedbackId, adminResponse };
  } catch (error) {
    console.error('Error responding to feedback:', error);
    throw error;
  }
};

// User Management
export const updateUserStatus = async (userId, status) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return { id: userId, status };
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Fetch Functions
export const getAnnouncements = async (status = 'active') => {
  try {
    const announcementsRef = collection(db, 'announcements');
    const q = query(
      announcementsRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
};

export const getProducts = async (category = null) => {
  try {
    console.log('Fetching products from Firestore...'); // Debug log
    const productsRef = collection(db, 'products');
    let q = query(productsRef, where('status', '!=', 'deleted'));
    
    if (category && category !== 'All') {
      q = query(q, where('category', '==', category));
    }
    
    const snapshot = await getDocs(q);
    console.log('Products snapshot received:', snapshot.size, 'documents'); // Debug log

    if (snapshot.empty) {
      console.log('No products found in Firestore'); // Debug log
      return [];
    }

    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      // Validate and format each product
      return {
        id: doc.id,
        name: data.name || 'Unnamed Product',
        price: typeof data.price === 'number' ? data.price : 0,
        description: data.description || '',
        image: data.image || '/placeholder.png',
        unit: data.unit || 'kg',
        customizable: data.customizable ?? true,
        minOrder: typeof data.minOrder === 'number' ? data.minOrder : 1,
        category: data.category || 'Uncategorized',
        stock: typeof data.stock === 'number' ? data.stock : 0,
        status: data.status || 'active',
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
      };
    });

    console.log('Processed products:', products); // Debug log
    return products;
  } catch (error) {
    console.error('Error in getProducts:', error);
    // Rethrow with more context
    throw new Error(`Failed to fetch products: ${error.message}`);
  }
};

export const getFeedbacks = async (status = null) => {
  try {
    const feedbacksRef = collection(db, 'feedbacks');
    let q = query(feedbacksRef);  // Remove orderBy temporarily
    
    if (status) {
      // Map filter status to database status
      const statusMap = {
        'unread': 'unread',
        'read': 'reviewed',
        'pending': 'unread'
      };
      const dbStatus = statusMap[status] || status;
      q = query(q, where('status', '==', dbStatus));
    }
    
    const snapshot = await getDocs(q);
    const feedbacks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Map message to comment for consistency
        comment: data.message || data.comment,
        // Ensure createdAt is a Date object
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
      };
    });

    // Sort in memory while index is building
    return feedbacks.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB - dateA;  // Descending order
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    throw error;
  }
};

export const getUserDetails = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// Orders Management
export const getOrders = async (status = null) => {
  try {
    const ordersRef = collection(db, 'orders');
    let q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    if (status && status !== 'all') {
      q = query(q, where('status', '==', status));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status, adminId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedBy: adminId,
      updatedAt: serverTimestamp()
    });
    return { id: orderId, status };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...orderData };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// User Management
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return { id: userId };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
    return { id: userId, ...profileData };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Cart Management
export const saveUserCart = async (userId, cartItems) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await setDoc(cartRef, {
      items: cartItems,
      updatedAt: serverTimestamp()
    });
    return { userId, items: cartItems };
  } catch (error) {
    console.error('Error saving cart:', error);
    throw error;
  }
};

export const getUserCart = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    const cartDoc = await getDoc(cartRef);
    if (cartDoc.exists()) {
      return cartDoc.data().items;
    }
    return [];
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}; 