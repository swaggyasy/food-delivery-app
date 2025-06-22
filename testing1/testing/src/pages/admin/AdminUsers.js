import React, { useState, useEffect } from 'react';
import { 
  FiUserPlus, 
  FiEdit, 
  FiTrash2, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiSearch, 
  FiFilter, 
  FiUsers, 
  FiUser, 
  FiShield, 
  FiLoader,
  FiCalendar,
  FiClock
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getAllUsers, updateUserStatus, deleteUser } from '../../services/AdminService';
import '../../styles/AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setUpdatingStatus(userId);
      await updateUserStatus(userId, newStatus);
      await loadUsers();
      toast.success('User status updated successfully');
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === 'admin') {
      toast.error('Cannot delete admin user');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setDeletingUser(userId);
        await deleteUser(userId);
        await loadUsers();
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error('Failed to delete user');
      } finally {
        setDeletingUser(null);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    
    const matchesRole = 
      filterRole === 'all' || 
      (filterRole === 'admin' && user.isAdmin) ||
      (filterRole === 'user' && !user.isAdmin);

    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="loading-state">
        <FiLoader className="loading-spinner" />
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="users-header">
        <div className="header-content">
          <h2>
            <FiUsers className="header-icon" />
            User Management
          </h2>
          <p className="header-subtitle">Manage user accounts and permissions</p>
        </div>
        
        <div className="users-filters">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-wrapper">
              <label>
                <FiFilter className="filter-icon" />
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="role-filter"
              >
                <option value="all">All Users</option>
                <option value="admin">Administrators</option>
                <option value="user">Regular Users</option>
              </select>
            </div>

            <button className="refresh-btn" onClick={loadUsers}>
              <FiLoader />
            </button>
          </div>
        </div>
      </div>

      <div className="users-list">
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <FiUsers className="no-users-icon" />
            <p>No users found</p>
            <p className="no-users-subtitle">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              {updatingStatus === user.id && (
                <div className="updating-overlay">
                  <FiLoader className="updating-spinner" />
                  <span>Updating status...</span>
                </div>
              )}
              
              {deletingUser === user.id && (
                <div className="updating-overlay">
                  <FiLoader className="updating-spinner" />
                  <span>Deleting user...</span>
                </div>
              )}

              <div className="user-header">
                <div className="user-info">
                  <h3>
                    {user.isAdmin ? <FiShield className="admin-icon" /> : <FiUser className="user-icon" />}
                    {user.name}
                  </h3>
                  <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                    {user.isAdmin ? 'Administrator' : 'Regular User'}
                  </span>
                </div>
                <div className="user-status">
                  <select
                    value={user.status || 'active'}
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                    className={`status-select ${user.status || 'active'}`}
                    disabled={user.isAdmin || updatingStatus === user.id}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>
              </div>

              <div className="user-details">
                <div className="info-card">
                  <h4>
                    <FiMail className="info-icon" />
                    Contact Information
                  </h4>
                  <div className="info-content">
                    <p><strong>Email:</strong> {user.email}</p>
                    {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
                    {user.address && (
                      <p className="address-info">
                        <strong>Address:</strong>
                        {typeof user.address === 'object' 
                          ? `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''}, ${user.address.zipcode || ''}, ${user.address.country || ''}`
                          : user.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="info-card">
                  <h4>
                    <FiCalendar className="info-icon" />
                    Account Information
                  </h4>
                  <div className="info-content">
                    <p>
                      <FiCalendar className="meta-icon" />
                      <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      <FiClock className="meta-icon" />
                      <strong>Last Login:</strong> {new Date(user.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {!user.isAdmin && (
                <div className="user-actions">
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deletingUser === user.id}
                  >
                    <FiTrash2 /> Delete User
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminUsers;