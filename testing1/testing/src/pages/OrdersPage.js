import React, { useState, useEffect } from 'react';
import { FiShoppingBag, FiClock, FiBox, FiCheck, FiXCircle, FiAlertCircle, FiSearch, FiCalendar, FiFilter, FiRefreshCw, FiLoader, FiEye, FiPrinter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { sendCancellationNotification } from '../utils/telegramNotifications';
import '../styles/OrdersPage.css';
import PrintReceipt from '../components/PrintReceipt';
import OrderTracking from '../components/OrderTracking';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isIndexBuilding, setIsIndexBuilding] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', {
        isAuthenticated: !!user,
        currentUser: user ? {
          uid: user.uid,
          email: user.email
        } : null
      });

      if (!user) {
        console.log('No authenticated user found, redirecting to login');
        toast.error('Please login to view your orders');
        navigate('/login');
        return;
      }

      setAuthChecked(true);
      
      // Clear any cached orders from localStorage
      localStorage.removeItem('userOrders');
      
      console.log('Loading orders for user:', {
        uid: user.uid,
        email: user.email
      });
      
      loadOrders();
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    let retryTimer;
    if (isIndexBuilding && retryCount < 6) { // Try up to 6 times (1 minute total)
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadOrders();
      }, 10000); // Retry every 10 seconds
    }
    return () => clearTimeout(retryTimer);
  }, [isIndexBuilding, retryCount]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('Starting to load orders...');
      
      const currentUser = auth.currentUser;
      console.log('Current user state:', {
        exists: !!currentUser,
        uid: currentUser?.uid,
        email: currentUser?.email,
        emailVerified: currentUser?.emailVerified
      });
      
      if (!currentUser) {
        console.error('No authenticated user found in loadOrders');
        toast.error('Please login to view your orders');
        navigate('/login');
        return;
      }

      // First, ensure user document exists in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      console.log('Checking user document for:', currentUser.uid);
      
      const userDoc = await getDoc(userRef);
      console.log('User document exists:', userDoc.exists());
      
      if (!userDoc.exists()) {
        console.log('User document does not exist, creating one...');
        const userData = {
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || currentUser.email.split('@')[0],
          isAdmin: currentUser.email === 'admin@gmail.com' || currentUser.email === 'admin2@gmail.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        console.log('Creating user document with data:', userData);
        
        try {
          await setDoc(userRef, userData);
          console.log('User document created successfully');
        } catch (createError) {
          console.error('Error creating user document:', createError);
          console.error('Create error details:', {
            code: createError.code,
            message: createError.message,
            fullError: createError
          });
          toast.error('Error setting up user account. Please try again.');
          return;
        }
      } else {
        console.log('User document already exists:', userDoc.data());
      }

      const ordersRef = collection(db, 'orders');
      const currentUserId = currentUser.uid;
      console.log('Fetching orders for user:', {
        uid: currentUserId,
        email: currentUser.email
      });
      
      // Try the main query first
      let querySnapshot;
      try {
        const q = query(
          ordersRef,
          where('userId', '==', currentUserId),
          orderBy('createdAt', 'desc')
        );
        
        console.log('Executing query with index...');
        console.log('Query details:', {
          collection: 'orders',
          where: `userId == ${currentUserId}`,
          orderBy: 'createdAt desc'
        });
        
        querySnapshot = await getDocs(q);
        console.log('Found orders with main query:', {
          count: querySnapshot.size,
          userId: currentUserId
        });
      } catch (queryError) {
        console.error('Main query failed, trying fallback query:', queryError);
        
        // Fallback: try without ordering
        try {
          const fallbackQ = query(
            ordersRef,
            where('userId', '==', currentUserId)
          );
          
          console.log('Executing fallback query without ordering...');
          querySnapshot = await getDocs(fallbackQ);
          console.log('Found orders with fallback query:', {
            count: querySnapshot.size,
            userId: currentUserId
          });
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
      }

      const ordersList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing order:', {
          orderId: doc.id,
          orderUserId: data.userId,
          currentUserId: currentUserId,
          matches: data.userId === currentUserId,
          orderEmail: data.email
        });
        
        // Helper function to safely convert timestamp to Date
        const safeToDate = (timestamp) => {
          if (!timestamp) return new Date();
          if (typeof timestamp === 'object' && timestamp.toDate) {
            return timestamp.toDate();
          }
          if (timestamp instanceof Date) {
            return timestamp;
          }
          if (typeof timestamp === 'string') {
            return new Date(timestamp);
          }
          if (typeof timestamp === 'number') {
            return new Date(timestamp);
          }
          return new Date();
        };
        
        return {
          id: doc.id,
          userId: data.userId || currentUserId,
          customerName: data.customerName || 'N/A',
          email: data.email || 'N/A',
          phone: data.phone || 'N/A',
          address: data.address || 'N/A',
          items: data.items || [],
          subtotal: parseFloat(data.subtotal) || 0,
          deliveryFee: parseFloat(data.deliveryFee) || 0,
          total: parseFloat(data.total) || 0,
          status: data.status || 'pending',
          paymentMethod: data.paymentMethod || 'N/A',
          deliveryType: data.deliveryType || 'N/A',
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
          cancellationReason: data.cancellationReason || null,
          cancelledAt: data.cancelledAt ? safeToDate(data.cancelledAt) : null
        };
      });

      // Additional security filter - only show orders that belong to current user
      const filteredOrdersList = ordersList.filter(order => {
        const belongsToUser = order.userId === currentUserId;
        const emailMatches = order.email === currentUser.email;
        
        if (!belongsToUser) {
          console.warn('Filtering out order that does not belong to current user:', {
            orderId: order.id,
            orderUserId: order.userId,
            currentUserId: currentUserId,
            orderEmail: order.email,
            currentUserEmail: currentUser.email
          });
        }
        
        // Only show orders that belong to current user AND have matching email
        return belongsToUser && emailMatches;
      });

      // Sort orders by date if we used the fallback query
      if (filteredOrdersList.length > 0 && !filteredOrdersList[0].createdAt) {
        filteredOrdersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      console.log('Processed orders:', {
        totalFound: ordersList.length,
        afterFiltering: filteredOrdersList.length,
        userId: currentUserId,
        orders: filteredOrdersList.map(order => ({
          id: order.id,
          userId: order.userId,
          email: order.email
        }))
      });

      setOrders(filteredOrdersList);
      setIsIndexBuilding(false);
      setRetryCount(0);
    } catch (error) {
      console.error('Error loading orders:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      
      if (error.code === 'failed-precondition' && error.message.includes('index is currently building')) {
        console.log('Index is building, will retry...');
        setIsIndexBuilding(true);
        toast.info('Preparing your orders. This may take a few moments...', {
          autoClose: false,
          closeOnClick: false
        });
      } else if (error.code === 'permission-denied') {
        console.error('Permission denied error');
        toast.error('You do not have permission to view orders. Please contact support.');
        setIsIndexBuilding(false);
      } else if (error.code === 'unauthenticated') {
        console.error('Unauthenticated error');
        toast.error('Please login to view your orders');
        navigate('/login');
      } else if (error.code === 'not-found') {
        console.log('No orders found');
        setOrders([]);
        setIsIndexBuilding(false);
      } else {
        console.error('Unknown error occurred:', error);
        toast.error(`Failed to load orders: ${error.message}`);
        setIsIndexBuilding(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const orderToCancel = orders.find(order => order.id === orderId);
      if (!orderToCancel) {
        toast.error('Order not found');
        return;
      }

      if (orderToCancel.status.toLowerCase() !== 'pending') {
        toast.error('Only pending orders can be cancelled');
        return;
      }

      const isConfirmed = window.confirm('Are you sure you want to cancel this order?');
      if (!isConfirmed) return;

      const reason = window.prompt('Please provide a reason for cancellation:');
      if (!reason || reason.trim() === '') {
        toast.error('A reason is required to cancel the order');
        return;
      }

      // Update order in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancellationReason: reason.trim(),
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Refresh orders list
      await loadOrders();

      // Send Telegram notification
      await sendCancellationNotification(orderToCancel, reason);
      
      toast.success('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const handleTrackOrder = (order) => {
    setSelectedOrderForTracking(order);
    setShowTrackingModal(true);
  };

  const closeTrackingModal = () => {
    setShowTrackingModal(false);
    setSelectedOrderForTracking(null);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !selectedDate || 
      new Date(order.createdAt).toLocaleDateString() === new Date(selectedDate).toLocaleDateString();
    
    return matchesStatus && matchesSearch && matchesDate;
  }).sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortBy === 'date' || sortBy === 'createdAt') {
      return sortOrder === 'desc' 
        ? new Date(bValue) - new Date(aValue)
        : new Date(aValue) - new Date(bValue);
    }
    
    return sortOrder === 'desc'
      ? bValue > aValue ? 1 : -1
      : aValue > bValue ? 1 : -1;
  });

  const getStatusIcon = (status) => {
    if (!status) {
      return <FiAlertCircle className="status-icon" />;
    }

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return <FiClock className="status-icon pending" />;
      case 'processing':
        return <FiBox className="status-icon processing" />;
      case 'completed':
        return <FiCheck className="status-icon completed" />;
      case 'cancelled':
        return <FiXCircle className="status-icon cancelled" />;
      default:
        return <FiAlertCircle className="status-icon" />;
    }
  };

  if (isIndexBuilding) {
    return (
      <div className="orders-page">
        <div className="index-building-message">
          <FiLoader className="loading-spinner" />
          <h2>Preparing Your Orders</h2>
          <p>We're getting your orders ready. This may take a few moments...</p>
          <p className="retry-count">Attempt {retryCount + 1} of 6</p>
        </div>
      </div>
    );
  }

  if (!authChecked || loading) {
    return (
      <div className="orders-page">
        <div className="loading-state">
          <FiLoader className="loading-spinner" />
          <p>{!authChecked ? 'Checking authentication...' : 'Loading your orders...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h2>My Orders</h2>
        <div className="orders-filters">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-filter"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-filter"
            >
              <option value="date">Sort by Date</option>
              <option value="total">Sort by Amount</option>
              <option value="status">Sort by Status</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="sort-order-btn"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>

            <button onClick={loadOrders} className="refresh-btn">
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <FiShoppingBag className="no-orders-icon" />
            <p>No orders found</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.id.slice(-6)}</h3>
                  <span className="order-date">
                    <FiCalendar /> {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${(order.status || 'pending').toLowerCase()}`}>
                    {order.status || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="order-content">
                <div className="order-grid">
                  <div className="order-section">
                    <h4>Customer Information</h4>
                    <div className="info-row">
                      <span className="info-label">Name</span>
                      <span className="info-value">{order.customerName || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">{order.email || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{order.phone || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Address</span>
                      <span className="info-value">{order.address || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="order-section">
                    <h4>Order Summary</h4>
                    <div className="info-row">
                      <span className="info-label">Items</span>
                      <span className="info-value">{order.items?.length || 0}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Subtotal</span>
                      <span className="info-value">${(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Delivery Fee</span>
                      <span className="info-value">${(order.deliveryFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Total</span>
                      <span className="info-value total">${(order.total || 0).toFixed(2)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Payment</span>
                      <span className="info-value">{order.paymentMethod || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Delivery</span>
                      <span className="info-value">{order.deliveryType || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="order-section">
                    <h4>Order Items</h4>
                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <div key={index} className="item-row">
                          <div>
                            <div className="item-name">{item.name}</div>
                            <div className="item-details">Quantity: {item.quantity}</div>
                          </div>
                          <span className="info-value">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="order-actions">
                <button
                  className="action-btn track-btn"
                  onClick={() => handleTrackOrder(order)}
                  title="Track Order"
                >
                  <FiEye />
                  Track
                </button>
                <PrintReceipt order={order} />
                {order.status.toLowerCase() === 'pending' && (
                  <button
                    className="action-btn cancel-btn"
                    onClick={() => handleCancelOrder(order.id)}
                    title="Cancel Order"
                  >
                    <FiXCircle />
                    Cancel
                  </button>
                )}
              </div>

              {order.cancellationReason && (
                <div className="cancellation-info">
                  <p><strong>Cancellation Reason:</strong> {order.cancellationReason}</p>
                  <p><strong>Cancelled At:</strong> {order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : 'N/A'}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Order Tracking Modal */}
      {showTrackingModal && selectedOrderForTracking && (
        <div className="modal-overlay">
          <div className="modal-content tracking-modal">
            <OrderTracking 
              orderId={selectedOrderForTracking.id} 
              onClose={closeTrackingModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;