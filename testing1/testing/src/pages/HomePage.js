import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiArrowRight, FiPackage, FiClock, FiCalendar, FiStar, FiTruck, FiPercent, FiChevronLeft, FiChevronRight, FiMessageSquare, FiUser, FiThumbsUp, FiLoader, FiEye, FiEyeOff } from 'react-icons/fi';
import { getAnnouncements } from '../services/AdminService';
import { auth, db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const [userOrders, setUserOrders] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);

  // Advertisement Slider Content
  const adSlides = [
    {
      id: 1,
      image: "/images/premium.jpeg",
      title: "Premium Quality Meat",
      description: "Fresh and premium cuts for your family",
      buttonText: "Shop Now",
      link: "/dashboard/products",
      backgroundColor: "#ff6b6b"
    },
    {
      id: 2,
      image: "/images/special.png",
      title: "Special Deal: 20% Off",
      description: "Limited time offer on selected items",
      buttonText: "View Deals",
      link: "/dashboard/products",
      backgroundColor: "#4ecdc4"
    },
    {
      id: 3,
      image: "/images/delivery.jpeg",
      title: "Free Delivery",
      description: "On orders above RM150",
      buttonText: "Learn More",
      link: "/dashboard/products",
      backgroundColor: "#ffd93d"
    }
  ];

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => 
        prevIndex === adSlides.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlideIndex(current => 
      current === adSlides.length - 1 ? 0 : current + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlideIndex(current => 
      current === 0 ? adSlides.length - 1 : current - 1
    );
  };

  // Featured products (mock data - replace with actual data)
  const featuredProducts = [
    {
      id: 1,
      name: "Premium Lamb Rack",
      price: 40.00,
      image: "/images/lamb rack.jpeg",
      discount: 15
    },
    {
      id: 2,
      name: "Premium Ribs Meat",
      price: 50.00,
      image: "/images/ribs meat.jpeg",
      discount: 20
    },
    {
      id: 3,
      name: "Premium Chicken Breast",
      price: 20.00,
      image: "/images/dada ayam.jpeg",
      discount: 10
    }
  ];

  // Load user orders from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadUserOrders(user.uid);
      } else {
        setUserOrders([]);
        setIsLoadingOrders(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserOrders = async (userId) => {
    try {
      setIsLoadingOrders(true);
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          date: data.createdAt?.toDate?.() || new Date(data.createdAt)
        };
      });
      
      setUserOrders(orders);
    } catch (error) {
      console.error('Error loading user orders:', error);
      setUserOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Load feedbacks when showFeedback changes
  useEffect(() => {
    if (showFeedback) {
      loadFeedbacks();
    }
  }, [showFeedback]);

  const loadFeedbacks = async () => {
    try {
      setIsLoadingFeedbacks(true);
      console.log('Loading feedbacks from Firestore...');
      
      const feedbacksRef = collection(db, 'feedbacks');
      const q = query(
        feedbacksRef,
        orderBy('createdAt', 'desc')
      );
      
      console.log('Executing feedback query...');
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} feedback documents`);
      
      const feedbacks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Processing feedback ${doc.id}:`, {
          userName: data.userName,
          message: data.message?.substring(0, 50) + '...',
          rating: data.rating,
          status: data.status,
          hasAdminResponse: !!data.adminResponse
        });
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
        };
      });
      
      console.log('Processed feedbacks:', feedbacks.length);
      setFeedbacks(feedbacks);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
      setFeedbacks([]);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  // Get recent orders sorted by date
  const recentOrders = [...userOrders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 2); // Limit to 2 orders only

  // Load announcements from Firestore
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setIsLoadingAnnouncements(true);
        const announcementsList = await getAnnouncements('active');
        
        // Sort announcements: pinned items first, then by date.
        announcementsList.sort((a, b) => {
          if (a.isPinned === b.isPinned) {
            // If both are pinned or unpinned, sort by date (newest first)
            return new Date(b.date) - new Date(a.date);
          }
          // Otherwise, the pinned item comes first
          return a.isPinned ? -1 : 1;
        });

        setAnnouncements(announcementsList);
      } catch (error) {
        console.error('Error loading announcements:', error);
      } finally {
        setIsLoadingAnnouncements(false);
      }
    };

    loadAnnouncements();
  }, []);

  // Function to get status color
  const getStatusColor = (status) => {
    status = status?.toLowerCase();
    switch(status) {
      case 'pending':
        return '#ffd93d';
      case 'processing':
        return '#4ecdc4';
      case 'cancelled':
        return '#ff6b6b';
      case 'delivered':
        return '#2ecc71';
      default:
        return '#666';
    }
  };

  // Handler for viewing all orders
  const handleViewAllOrders = () => {
    navigate('/dashboard/user/orders');
  };

  const getRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar 
        key={index}
        className={`star ${index < rating ? 'filled' : ''}`}
        size={14}
      />
    ));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'unread': { color: '#f39c12', text: 'Unread', icon: '⏳' },
      'reviewed': { color: '#27ae60', text: 'Replied', icon: '✅' },
      'pending': { color: '#f39c12', text: 'Pending', icon: '⏳' }
    };
    
    const config = statusConfig[status] || statusConfig['unread'];
    
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.icon} {config.text}
      </span>
    );
  };

  return (
    <div className="home-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-message">
          <h1>Welcome back, <span className="user-name">{currentUser.name || 'User'}</span>!</h1>
          <p>Discover premium frozen foods for your family</p>
        </div>
        <div className="quick-actions">
          <button 
            className="action-btn shop"
            onClick={() => navigate('/dashboard/products')}
          >
            <FiShoppingBag />
            Start Shopping
          </button>
          <button 
            className="action-btn orders"
            onClick={() => navigate('/dashboard/orders')}
          >
            <FiPackage />
            My Orders
          </button>
        </div>
      </div>

      {/* Advertisement Slider */}
      <div className="ad-slider">
        <button className="slider-btn prev" onClick={prevSlide}>
          <FiChevronLeft />
        </button>
        <div 
          className="slider-content"
          style={{
            backgroundImage: `url(${adSlides[currentSlideIndex].image})`,
            backgroundColor: adSlides[currentSlideIndex].backgroundColor
          }}
        >
          <div className="slider-overlay"></div>
          <div className="slider-text">
            <h1>{adSlides[currentSlideIndex].title}</h1>
            <p>{adSlides[currentSlideIndex].description}</p>
            <button 
              className="slider-cta"
              onClick={() => navigate(adSlides[currentSlideIndex].link)}
            >
              {adSlides[currentSlideIndex].buttonText} <FiArrowRight />
            </button>
          </div>
        </div>
        <button className="slider-btn next" onClick={nextSlide}>
          <FiChevronRight />
        </button>
        <div className="slider-dots">
          {adSlides.map((_, index) => (
            <span 
              key={index} 
              className={`dot ${index === currentSlideIndex ? 'active' : ''}`}
              onClick={() => setCurrentSlideIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="section-header">
          <h2>Featured Products</h2>
          <button 
            className="view-all-btn"
            onClick={() => navigate('/dashboard/products')}
          >
            View All <FiArrowRight />
          </button>
        </div>
        <div className="featured-products">
          {featuredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                <span className="discount-badge">-{product.discount}%</span>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <div className="product-price">
                  <span className="current-price">
                    RM {(product.price * (1 - product.discount / 100)).toFixed(2)}
                  </span>
                  <span className="original-price">RM {product.price}</span>
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={() => navigate(`/dashboard/products/${product.id}`)}
                >
                  View Details <FiArrowRight />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Feedback Section */}
      <section className="feedback-section">
        <div className="section-header">
          <div className="header-title">
            <FiMessageSquare className="section-icon" />
            <h2>Community Feedback</h2>
          </div>
          <button 
            className="toggle-btn"
            onClick={() => setShowFeedback(!showFeedback)}
          >
            {showFeedback ? <FiEyeOff /> : <FiEye />}
            {showFeedback ? 'Hide' : 'Show'} Feedback
          </button>
        </div>

        {showFeedback && (
          <div className="feedback-viewer">
            {isLoadingFeedbacks ? (
              <div className="loading-feedback">
                <FiLoader className="loading-spinner" />
                <p>Loading community feedback...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="no-feedback">
                <FiMessageSquare className="no-feedback-icon" />
                <p>No feedback available yet.</p>
                <p className="no-feedback-subtitle">Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="feedback-grid">
                {feedbacks.slice(0, 6).map(feedback => (
                  <div key={feedback.id} className="feedback-card">
                    <div className="feedback-header">
                      <div className="user-info">
                        <div className="user-avatar">
                          <FiUser />
                        </div>
                        <div className="user-details">
                          <h4>{feedback.userName || 'Anonymous User'}</h4>
                          <span className="feedback-date">
                            <FiCalendar />
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="feedback-rating">
                        {getRatingStars(feedback.rating)}
                      </div>
                    </div>
                    
                    <div className="feedback-content">
                      <p className="feedback-message">{feedback.message}</p>
                    </div>

                    {feedback.adminResponse && (
                      <div className="admin-reply">
                        <div className="reply-header">
                          <FiThumbsUp className="reply-icon" />
                          <span>Admin Response</span>
                          <span className="reply-date">
                            {new Date(feedback.adminResponse.respondedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="reply-message">{feedback.adminResponse.response}</p>
                      </div>
                    )}

                    {getStatusBadge(feedback.status)}
                  </div>
                ))}
              </div>
            )}
            
            {feedbacks.length > 6 && (
              <div className="feedback-footer">
                <button 
                  className="view-all-feedback-btn"
                  onClick={() => navigate('/contact')}
                >
                  View All Feedback <FiArrowRight />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recent Updates and Orders Grid */}
      <div className="dashboard-grid">
        {/* Recent Updates Section */}
        <section className="updates-section">
          <div className="section-header">
            <div className="header-title">
              <FiCalendar className="section-icon" />
              <h2>Recent Updates</h2>
            </div>
            <span className="update-count">{announcements.length} Updates</span>
          </div>
          <div className="updates-list">
            {isLoadingAnnouncements ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading updates...</p>
              </div>
            ) : announcements.length > 0 ? (
              <div className="announcements-section">
                <h2>
                  <FiMessageSquare /> Announcements
                </h2>
                <div className="announcements-list">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className={`announcement-item ${announcement.isPinned ? 'pinned' : ''}`}>
                      <div className="announcement-header">
                        {announcement.isPinned && <FiStar className="pin-icon" />}
                        <h3>{announcement.title}</h3>
                      </div>
                      <p>{announcement.content}</p>
                      <div className="announcement-footer">
                        <span>{new Date(announcement.date).toLocaleDateString()}</span>
                        {announcement.link && (
                          <a href={announcement.link} target="_blank" rel="noopener noreferrer">
                            Learn More
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <FiCalendar className="empty-icon" />
                <p>No updates available</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Orders Section */}
        <section className="orders-section">
          <div className="section-header">
            <div className="header-title">
              <FiShoppingBag className="section-icon" />
              <h2>Recent Orders</h2>
            </div>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/dashboard/orders')}
            >
              View All <FiArrowRight />
            </button>
          </div>
          <div className="orders-list">
            {isLoadingOrders ? (
              <div className="loading-state">
                <FiLoader className="loading-spinner" />
                <p>Loading orders...</p>
              </div>
            ) : recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-id">
                      <FiPackage className="order-icon" />
                      <h3>Order #{order.id}</h3>
                    </div>
                    <span 
                      className="order-status"
                      style={{
                        backgroundColor: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status)
                      }}
                    >
                      {order.status || 'Pending'}
                    </span>
                  </div>
                  <div className="order-items">
                    {order.items && order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                        </div>
                        <span className="item-price">
                          RM {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.items && order.items.length > 2 && (
                      <div className="more-items">
                        +{order.items.length - 2} more items
                      </div>
                    )}
                  </div>
                  <div className="order-footer">
                    <div className="order-meta">
                      <span className="order-date">
                        <FiClock />
                        {new Date(order.date).toLocaleDateString()}
                      </span>
                      <span className="order-total">
                        Total: RM {order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {order.cancellationReason && (
                    <div className="cancellation-reason">
                      <p>Cancelled: {order.cancellationReason}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FiShoppingBag className="empty-icon" />
                <p>No orders yet</p>
                <button 
                  className="start-shopping-btn"
                  onClick={() => navigate('/dashboard/products')}
                >
                  Start Shopping <FiArrowRight />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;