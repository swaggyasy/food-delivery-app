import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiPackage, 
  FiShoppingBag, 
  FiDollarSign,
  FiCalendar,
  FiTrendingUp,
  FiRefreshCw
} from 'react-icons/fi';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    ordersToday: 0,
    totalRevenue: 0,
    recentOrders: []
  });
  const [period, setPeriod] = useState('today');

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    loadDashboardStats();
  }, [period]);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      console.log('Loading dashboard stats...');

      // Get users count
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      console.log('Total users:', totalUsers);

      // Get products count
      const productsSnapshot = await getDocs(query(
        collection(db, 'products'),
        where('status', '!=', 'deleted')
      ));
      const totalProducts = productsSnapshot.size;
      console.log('Total products:', totalProducts);

      // Get orders with better timestamp handling
      const ordersRef = collection(db, 'orders');
      
      // Create date range for filtering
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      console.log('Start date for orders:', startDate);
      console.log('Current date:', now);

      // Try different approaches to get orders
      let orders = [];
      
      try {
        // First try: Query with timestamp
        const ordersQuery = query(
          ordersRef,
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          orderBy('createdAt', 'desc')
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        
        console.log('Orders found with timestamp query:', orders.length);
      } catch (timestampError) {
        console.log('Timestamp query failed, trying alternative approach:', timestampError);
        
        // Second try: Get all orders and filter in memory
        const allOrdersSnapshot = await getDocs(ordersRef);
        const allOrders = allOrdersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        
        // Filter orders by date
        orders = allOrders.filter(order => {
          const orderDate = order.createdAt;
          return orderDate >= startDate;
        });
        
        console.log('Orders found with memory filter:', orders.length);
      }

      // Log order details for debugging
      orders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`, {
          id: order.id,
          createdAt: order.createdAt,
          total: order.total,
          status: order.status,
          customerName: order.customerName || order.email
        });
      });

      // Calculate statistics
      const ordersToday = orders.length;
      const totalRevenue = orders.reduce((sum, order) => {
        const orderTotal = parseFloat(order.total) || 0;
        console.log(`Order ${order.id} total: ${orderTotal}`);
        return sum + orderTotal;
      }, 0);
      const recentOrders = orders.slice(0, 5);

      console.log('Final stats:', {
        ordersToday,
        totalRevenue,
        recentOrdersCount: recentOrders.length
      });

      setDashboardStats({
        totalUsers,
        totalProducts,
        ordersToday,
        totalRevenue,
        recentOrders
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Set default values on error
      setDashboardStats(prev => ({
        ...prev,
        ordersToday: 0,
        totalRevenue: 0,
        recentOrders: []
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    setIsRefreshing(true);
    await loadDashboardStats();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleViewAllOrders = () => {
    navigate('/admin/orders');
  };

  // Update statCards with trend indicators
  const statCards = [
    {
      title: 'Total Users',
      value: dashboardStats.totalUsers,
      icon: <FiUsers />,
      color: '#1a73e8',
      trend: '+12%'
    },
    {
      title: 'Total Products',
      value: dashboardStats.totalProducts,
      icon: <FiPackage />,
      color: '#34a853',
      trend: '+5%'
    },
    {
      title: 'Orders Today',
      value: dashboardStats.ordersToday,
      icon: <FiShoppingBag />,
      color: '#fbbc04',
      trend: '+18%'
    },
    {
      title: 'Revenue',
      value: `RM ${dashboardStats.totalRevenue.toFixed(2)}`,
      icon: <FiDollarSign />,
      color: '#ea4335',
      trend: '+25%'
    }
  ];

  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard Overview</h1>
          <div className="current-date">
            <FiCalendar />
            <span>{currentDate}</span>
          </div>
        </div>
        <div className="header-actions">
          <select 
            className="period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button 
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`} 
            onClick={refreshStats}
            disabled={isRefreshing}
          >
            <FiRefreshCw />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <div 
                className="stat-icon" 
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="stat-trend" style={{ color: stat.trend.startsWith('+') ? '#34a853' : '#ea4335' }}>
                <FiTrendingUp />
                {stat.trend}
              </div>
            </div>
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="recent-orders-card">
        <div className="card-header">
          <h2>Recent Orders</h2>
          <button className="view-all" onClick={handleViewAllOrders}>
            View All Orders
          </button>
        </div>
        <div className="table-container">
          {dashboardStats.recentOrders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardStats.recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <span className="order-id">#{order.id.slice(-6)}</span>
                    </td>
                    <td>{order.customerName || order.email || 'Unknown'}</td>
                    <td>{order.createdAt.toLocaleDateString()}</td>
                    <td>
                      <span className="amount">RM {parseFloat(order.total || 0).toFixed(2)}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${(order.status || 'pending').toLowerCase()}`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-orders">
              <p>No orders found for the selected period.</p>
              <p>Try selecting a different time period or check if orders exist in the database.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;