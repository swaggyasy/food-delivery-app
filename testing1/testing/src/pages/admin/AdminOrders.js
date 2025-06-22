import React, { useState, useEffect } from 'react';
import { 
  FiPackage, FiTruck, FiCheck, FiXCircle, FiPrinter,
  FiCalendar, FiClock, FiSearch, FiPhone, FiMapPin,
  FiCreditCard, FiShoppingBag, FiUser, FiMail,
  FiChevronDown, FiRefreshCw, FiCheckCircle, FiHelpCircle,
  FiEdit2, FiLoader, FiAlertCircle, FiFilter, FiDownload,
  FiEye, FiDollarSign, FiTag, FiInfo, FiList, FiPlus
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { db } from '../../firebase/config';
import { collection, query, orderBy, getDocs, updateDoc, doc, getDoc, where } from 'firebase/firestore';
import { createNotification, NOTIFICATION_TYPES } from '../../services/NotificationService';
import { 
  updateOrderStatus, 
  assignDeliveryPerson, 
  ORDER_STATUS,
  ORDER_STATUS_DISPLAY,
  ORDER_STATUS_ICONS,
  ORDER_STATUS_COLORS,
  updateDeliveryLocation
} from '../../services/OrderService';
import OrderTracking from '../../components/OrderTracking';
import DriverLocationUpdate from '../../components/DriverLocationUpdate';
import PrintReceipt from '../../components/PrintReceipt';
import '../../styles/AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusDropdownId, setStatusDropdownId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  useEffect(() => {
    console.log('AdminOrders component mounted');
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      console.log('Starting to load orders...');
      setIsLoading(true);
      setError(null);

      // Verify Firebase connection
      if (!db) {
        throw new Error('Firebase database is not initialized');
      }

      console.log('Accessing orders collection...');
      const ordersRef = collection(db, 'orders');
      
      console.log('Creating query...');
      const q = query(
        ordersRef,
        orderBy('createdAt', 'desc')
      );
      
      console.log('Executing query...');
      const querySnapshot = await getDocs(q);
      console.log(`Query returned ${querySnapshot.size} documents`);

      if (querySnapshot.empty) {
        console.log('No orders found in the database');
        setOrders([]);
        return;
      }

      console.log('Processing orders data...');
      const ordersList = querySnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          console.log(`Processing order ${doc.id}:`, {
            hasCustomerName: !!data.customerName,
            hasEmail: !!data.email,
            hasItems: !!data.items,
            status: data.status,
            createdAt: data.createdAt
          });

          // Validate required fields
          if (!data.createdAt) {
            console.warn(`Order ${doc.id} is missing createdAt field`);
          }

          return {
            id: doc.id,
            customerName: data.customerName || 'Unknown Customer',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            items: Array.isArray(data.items) ? data.items : [],
            subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
            deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
            total: typeof data.total === 'number' ? data.total : 0,
            status: data.status || 'pending',
            paymentMethod: data.paymentMethod || 'Unknown',
            deliveryType: data.deliveryType || 'Standard',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            cancellationReason: data.cancellationReason || '',
            cancelledAt: data.cancelledAt?.toDate?.() || null,
            userId: data.userId || null
          };
        } catch (docError) {
          console.error(`Error processing order ${doc.id}:`, docError);
          return null;
        }
      }).filter(Boolean); // Remove any null entries from failed processing

      console.log(`Successfully processed ${ordersList.length} orders`);
      setOrders(ordersList);
    } catch (error) {
      console.error('Detailed error loading orders:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      
      setError(error.message || 'Failed to load orders');
      toast.error(`Failed to load orders: ${error.message}`);
      
      // Set empty orders array to prevent undefined errors
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} status to ${newStatus}`);
      setUpdatingStatus(orderId);
      
      const orderRef = doc(db, 'orders', orderId);
      
      // Get the current order data using getDoc
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = orderDoc.data();
      console.log('Current order data:', orderData);
      
      // Update order status
      await updateDoc(orderRef, {
        status: newStatus.toLowerCase(),
        updatedAt: new Date().toISOString()
      });

      console.log('Order status updated successfully');

      // Send notification to customer based on status
      let notificationType;
      switch (newStatus.toLowerCase()) {
        case 'processing':
          notificationType = NOTIFICATION_TYPES.ORDER_SHIPPED;
          break;
        case 'completed':
          notificationType = NOTIFICATION_TYPES.ORDER_DELIVERED;
          break;
        case 'cancelled':
          notificationType = NOTIFICATION_TYPES.ORDER_CANCELLED;
          break;
        default:
          notificationType = NOTIFICATION_TYPES.ORDER_PLACED;
      }

      // Send notification to customer if userId exists
      if (orderData.userId) {
        try {
          await createNotification(orderData.userId, notificationType, {
            orderId,
            status: newStatus.toLowerCase()
          });
          console.log('Notification sent successfully');
        } catch (notificationError) {
          console.warn('Failed to send notification:', notificationError);
          // Don't fail the entire operation if notification fails
        }
      } else {
        console.log('No userId found, skipping notification');
      }

      // Reload orders to get updated data
      await loadOrders();
      toast.success(`Order status updated to ${newStatus}`);
      
      // Close the status dropdown
      setStatusDropdownId(null);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(`Failed to update order status: ${error.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': '#f39c12',
      'processing': '#3498db',
      'completed': '#27ae60',
      'cancelled': '#e74c3c'
    };
    return statusColors[status.toLowerCase()] || '#95a5a6';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'pending': <FiClock />,
      'processing': <FiPackage />,
      'completed': <FiCheck />,
      'cancelled': <FiXCircle />
    };
    return statusIcons[status.toLowerCase()] || <FiHelpCircle />;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedAndFilteredOrders = orders
    .filter(order => {
      const matchesStatus = filterStatus === 'all' || order.status.toLowerCase() === filterStatus.toLowerCase();
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = dateFilter === 'all' || 
        new Date(order.createdAt).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
      
      return matchesStatus && matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'date':
          return multiplier * (new Date(b.createdAt) - new Date(a.createdAt));
        case 'amount':
          return multiplier * (b.total - a.total);
        case 'status':
          return multiplier * a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalAmount: orders.reduce((sum, order) => sum + order.total, 0)
    };
    return stats;
  };

  const stats = getOrderStats();

  const handleTrackOrder = (order) => {
    // If no deliveryPerson, set to Hairol by default
    if (!order.deliveryPerson) {
      order.deliveryPerson = {
        id: '0142775103',
        name: 'Hairol',
        phone: '0142775103',
        vehicle: 'Motorcycle'
      };
    }
    setSelectedOrderForTracking(order);
    setShowTrackingModal(true);
  };

  const closeTrackingModal = () => {
    setShowTrackingModal(false);
    setSelectedOrderForTracking(null);
  };

  const handleUpdateDriverLocation = async (orderId) => {
    try {
      // For testing: Update driver location to a random nearby location
      const testLocations = [
        { latitude: 3.1390, longitude: 101.6869 }, // Kuala Lumpur
        { latitude: 3.1410, longitude: 101.6889 }, // Nearby location 1
        { latitude: 3.1370, longitude: 101.6849 }, // Nearby location 2
        { latitude: 3.1430, longitude: 101.6909 }, // Nearby location 3
      ];
      
      const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];
      
      await updateDeliveryLocation(orderId, randomLocation);
      toast.success('Driver location updated for testing');
      loadOrders(); // Reload orders
    } catch (error) {
      console.error('Error updating driver location:', error);
      toast.error('Failed to update driver location');
    }
  };

  if (error) {
    return (
      <div className="admin-orders">
        <div className="error-state">
          <FiAlertCircle className="error-icon" />
          <h3>Error Loading Orders</h3>
          <p>{error}</p>
          <button onClick={loadOrders} className="retry-button">
            <FiRefreshCw /> Retry Loading Orders
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="admin-orders">
        <div className="loading-state">
          <FiLoader className="loading-spinner" />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="orders-header">
        <div className="header-content">
          <h2>
            <FiPackage className="header-icon" />
            Order Management
          </h2>
          <p className="header-subtitle">Manage and track all customer orders</p>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <FiShoppingBag className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
          <div className="stat-card">
            <FiDollarSign className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">RM {stats.totalAmount.toFixed(2)}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
          <div className="stat-card">
            <FiClock className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.pending}</span>
              <span className="stat-label">Pending Orders</span>
            </div>
          </div>
          <div className="stat-card">
            <FiCheckCircle className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed Orders</span>
            </div>
          </div>
        </div>
        
        <div className="orders-filters">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-wrapper">
              <label>
                <FiFilter className="filter-icon" />
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-wrapper">
              <label>
                <FiCalendar className="filter-icon" />
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter === 'all' ? '' : dateFilter}
                onChange={(e) => setDateFilter(e.target.value || 'all')}
                className="date-filter"
              />
            </div>

            <div className="filter-wrapper">
              <label>
                <FiTag className="filter-icon" />
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="sort-filter"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="view-controls">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <FiShoppingBag />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <FiList />
              </button>
            </div>

            <button onClick={loadOrders} className="refresh-btn" title="Refresh Orders">
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </div>

      <div className={`orders-list ${viewMode}`}>
        {sortedAndFilteredOrders.length === 0 ? (
          <div className="no-orders">
            <FiShoppingBag className="no-orders-icon" />
            <p>No orders found</p>
            <p className="no-orders-subtitle">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          sortedAndFilteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>
                    <span className="order-id">#{order.id.slice(-6)}</span>
                    <span className="order-date">
                      <FiCalendar /> {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </h3>
                  <div className="order-meta">
                    <span className="order-amount">
                      <FiDollarSign /> RM {order.total.toFixed(2)}
                    </span>
                    <span className="order-items">
                      <FiShoppingBag /> {order.items.length} items
                    </span>
                  </div>
                </div>
                <div className="order-status">
                  <div className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </div>
                  <div className="status-actions">
                    <button 
                      className="action-btn track-btn"
                      onClick={() => handleTrackOrder(order)}
                      title="Track Order"
                    >
                      <FiEye />
                      Track
                    </button>
                    <PrintReceipt order={order} />
                    <button 
                      className="action-btn location-btn"
                      onClick={() => handleUpdateDriverLocation(order.id)}
                      title="Update Driver Location (Test)"
                      disabled={!order.deliveryPerson}
                    >
                      <FiMapPin />
                      Update Location
                    </button>
                    <button 
                      className="status-change-btn"
                      onClick={() => setStatusDropdownId(statusDropdownId === order.id ? null : order.id)}
                    >
                      <FiEdit2 /> Change Status
                    </button>
                    {statusDropdownId === order.id && (
                      <div className="status-options">
                        <button
                          onClick={() => handleStatusChange(order.id, 'pending')}
                          disabled={updatingStatus === order.id}
                          className={order.status === 'pending' ? 'active' : ''}
                        >
                          <FiClock /> Pending
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, 'processing')}
                          disabled={updatingStatus === order.id}
                          className={order.status === 'processing' ? 'active' : ''}
                        >
                          <FiPackage /> Processing
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          disabled={updatingStatus === order.id}
                          className={order.status === 'completed' ? 'active' : ''}
                        >
                          <FiCheckCircle /> Completed
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          disabled={updatingStatus === order.id}
                          className={order.status === 'cancelled' ? 'active' : ''}
                        >
                          <FiXCircle /> Cancelled
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="order-details">
                <div className="customer-info">
                  <div className="info-card">
                    <h4><FiUser /> Customer Information</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Name</span>
                        <span className="info-value">{order.customerName}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{order.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone</span>
                        <span className="info-value">{order.phone}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Address</span>
                        <span className="info-value">{order.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-summary">
                  <div className="info-card">
                    <h4><FiShoppingBag /> Order Items</h4>
                    <div className="items-list">
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item">
                          <div className="item-info">
                            <span className="item-name">{item.name || 'Unknown Item'}</span>
                            <span className="item-quantity">x{item.quantity || 0}</span>
                          </div>
                          <span className="item-price">RM {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-totals">
                      <div className="total-row">
                        <span>Subtotal</span>
                        <span>RM {(order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="total-row">
                        <span>Delivery Fee</span>
                        <span>RM {(order.deliveryFee || 0).toFixed(2)}</span>
                      </div>
                      <div className="total-row total">
                        <span>Total</span>
                        <span>RM {(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="payment-info">
                      <div className="info-item">
                        <FiCreditCard className="info-icon" />
                        <span className="info-label">Payment Method</span>
                        <span className="info-value">{order.paymentMethod}</span>
                      </div>
                      <div className="info-item">
                        <FiTruck className="info-icon" />
                        <span className="info-label">Delivery Type</span>
                        <span className="info-value">{order.deliveryType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {order.cancellationReason && (
                <div className="cancellation-info">
                  <FiAlertCircle className="cancellation-icon" />
                  <div className="cancellation-details">
                    <p><strong>Reason:</strong> {order.cancellationReason}</p>
                    <p><strong>Cancelled:</strong> {new Date(order.cancelledAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {updatingStatus === order.id && (
                <div className="updating-overlay">
                  <FiLoader className="updating-spinner" />
                  <span>Updating status...</span>
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
            <button className="close-btn" onClick={closeTrackingModal}>×</button>
            <div className="tracking-content">
              <OrderTracking 
                orderId={selectedOrderForTracking.id} 
                onClose={closeTrackingModal}
              />
              {selectedOrderForTracking.deliveryPerson && (
                <div className="driver-section">
                  <h4>Driver Location Management</h4>
                  <DriverLocationUpdate 
                    orderId={selectedOrderForTracking.id} 
                    driverId={selectedOrderForTracking.deliveryPerson.id || 'driver-' + selectedOrderForTracking.id}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;