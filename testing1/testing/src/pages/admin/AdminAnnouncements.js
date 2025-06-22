import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createAnnouncement, updateAnnouncement, getAnnouncements } from '../../services/AdminService';
import '../../styles/AdminAnnouncements.css';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexBuilding, setIsIndexBuilding] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    link: '',
    isPinned: false,
    status: 'active'
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const announcementsList = await getAnnouncements();
      setAnnouncements(announcementsList);
      setIsIndexBuilding(false);
      setRetryCount(0);
    } catch (error) {
      console.error('Error loading announcements:', error);
      
      // Check if the error is due to index building
      if (error.message && error.message.includes('index is currently building')) {
        setIsIndexBuilding(true);
        // Retry after 10 seconds if we haven't retried too many times
        if (retryCount < 6) { // Will retry for up to 1 minute (6 * 10 seconds)
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            loadAnnouncements();
          }, 10000);
        }
      } else {
        toast.error('Failed to load announcements');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      link: '',
      isPinned: false,
      status: 'active'
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setIsLoading(true);
      const announcementData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };

      if (editingId) {
        await updateAnnouncement(editingId, announcementData);
        toast.success('Announcement updated successfully');
      } else {
        await createAnnouncement(announcementData);
        toast.success('Announcement created successfully');
      }

      await loadAnnouncements();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Failed to save announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      date: new Date(announcement.date).toISOString().split('T')[0],
      link: announcement.link || '',
      isPinned: announcement.isPinned || false,
      status: announcement.status || 'active'
    });
    setEditingId(announcement.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        setIsLoading(true);
        await updateAnnouncement(id, { status: 'deleted' });
        await loadAnnouncements();
        toast.success('Announcement deleted successfully');
      } catch (error) {
        toast.error('Failed to delete announcement');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePinToggle = async (announcement) => {
    try {
      setIsLoading(true);
      await updateAnnouncement(announcement.id, { 
        isPinned: !announcement.isPinned,
        updatedAt: new Date().toISOString()
      });
      
      await loadAnnouncements(); // Reload announcements to get updated data
      toast.success(
        `Announcement ${!announcement.isPinned ? 'pinned' : 'unpinned'} successfully`
      );
    } catch (error) {
      console.error('Error toggling pin status:', error);
      toast.error('Failed to update pin status');
    } finally {
      setIsLoading(false);
    }
  };

  // Sort announcements to show pinned ones first
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      return new Date(b.date) - new Date(a.date);
    }
    return b.isPinned ? 1 : -1;
  });

  if (isLoading) {
    return <div className="loading">Loading announcements...</div>;
  }

  if (isIndexBuilding) {
    return (
      <div className="index-building-message">
        <h2>Setting up announcements...</h2>
        <p>This may take a few minutes. We'll automatically retry loading the announcements.</p>
        <p>Attempt {retryCount + 1} of 6</p>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-announcements">
      <div className="page-header">
        <h1>Announcement Management</h1>
        <button className="add-btn" onClick={() => {
          resetForm();
          setShowModal(true);
        }}>
          <FiPlus /> New Announcement
        </button>
      </div>

      <div className="announcements-list">
        {sortedAnnouncements.map(announcement => (
          <div key={announcement.id} className={`announcement-card ${announcement.isPinned ? 'pinned' : ''}`}>
            <div className="announcement-content">
              <div className="announcement-header">
                <div className="title-section">
                  {announcement.isPinned && <FiStar className="pin-icon" />}
                  <h3>{announcement.title}</h3>
                </div>
                <span className="date">
                  {new Date(announcement.date).toLocaleDateString()}
                </span>
              </div>
              <p>{announcement.content}</p>
              {announcement.link && (
                <a href={announcement.link} target="_blank" rel="noopener noreferrer" 
                   className="announcement-link">
                  Learn More
                </a>
              )}
            </div>
            <div className="announcement-actions">
              <button 
                className={`pin-btn ${announcement.isPinned ? 'active' : ''}`}
                onClick={() => handlePinToggle(announcement)}
                title={announcement.isPinned ? 'Unpin' : 'Pin'}
              >
                <FiStar />
                {announcement.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button 
                className="edit-btn"
                onClick={() => handleEdit(announcement)}
              >
                <FiEdit2 />
                Edit
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDelete(announcement.id)}
              >
                <FiTrash2 />
                Delete
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="no-announcements">
            <p>No announcements yet</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter announcement title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Enter announcement content"
                  required
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="link">Link (Optional)</label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="Enter optional link"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isPinned"
                    checked={formData.isPinned}
                    onChange={handleInputChange}
                  />
                  Pin this announcement
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <FiCheck /> {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;