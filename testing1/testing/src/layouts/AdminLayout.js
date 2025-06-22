import React from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiUsers, FiMessageSquare, FiBell, FiSettings, FiLogOut } from 'react-icons/fi';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminAnnouncements from '../pages/admin/AdminAnnouncements';
import AdminFeedback from '../pages/admin/AdminFeedback';
import '../styles/AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const menuItems = [
    { path: '/admin', icon: <FiHome />, label: 'Dashboard' },
    { path: '/admin/orders', icon: <FiShoppingBag />, label: 'Orders' },
    { path: '/admin/products', icon: <FiSettings />, label: 'Products' },
    { path: '/admin/users', icon: <FiUsers />, label: 'Users' },
    { path: '/admin/announcements', icon: <FiBell />, label: 'Announcements' },
    { path: '/admin/feedback', icon: <FiMessageSquare />, label: 'Feedback' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <nav className="admin-navbar">
        <div className="nav-brand">
          <h2>Admin Panel</h2>
        </div>
        
        <div className="nav-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-right">
          <span className="admin-email">{currentUser?.email}</span>
          <button className="logout-button" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="admin-content">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="feedback" element={<AdminFeedback />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminLayout;