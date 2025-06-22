import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX, FiInfo, FiMail } from 'react-icons/fi';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useCart } from '../context/CartContext';
import HomePage from '../pages/HomePage';
import ProductsPage from '../pages/ProductsPage';
import OrdersPage from '../pages/OrdersPage';
import ProfilePage from '../pages/ProfilePage';
import CartPage from '../pages/CartPage';
import AboutUsPage from '../pages/AboutUsPage';
import ContactUsPage from '../pages/ContactUsPage';
import CheckoutPage from '../pages/CheckoutPage';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { state } = useCart();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await signOut(auth);
        // Clear user-specific data
        localStorage.removeItem('currentUser');
        localStorage.removeItem(`cart_${currentUser.email}`);
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
  };

  const cartItemCount = state.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="dashboard-container">
      <nav className="top-nav">
        <div className="nav-left">
          <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <span className="brand-name">Dashboard</span>
        </div>

        <div className="nav-middle">
          <NavLink to="/dashboard" end className="nav-item">
            <FiHome /> <span>Home</span>
          </NavLink>
          <NavLink to="/dashboard/products" className="nav-item">
            <FiShoppingBag /> <span>Products</span>
          </NavLink>
          <NavLink to="/dashboard/orders" className="nav-item">
            <FiShoppingBag /> <span>Orders</span>
          </NavLink>
          <NavLink to="/dashboard/about" className="nav-item">
            <FiInfo /> <span>About</span>
          </NavLink>
          <NavLink to="/dashboard/contact" className="nav-item">
            <FiMail /> <span>Contact</span>
          </NavLink>
        </div>

        <div className="nav-right">
          <NavLink to="/dashboard/profile" className="icon-btn">
            <FiUser />
          </NavLink>
          <NavLink to="/dashboard/cart" className="icon-btn cart-icon">
            <FiShoppingCart />
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
          </NavLink>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="about" element={<AboutUsPage />} />
          <Route path="contact" element={<ContactUsPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="user/orders" element={<OrdersPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;