import React, { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiCalendar, 
  FiStar, 
  FiMessageSquare, 
  FiCheck, 
  FiX, 
  FiFilter,
  FiLoader,
  FiRefreshCw,
  FiAlertCircle,
  FiThumbsUp,
  FiThumbsDown,
  FiSend,
  FiTrash2,
  FiMessageCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getFeedbacks, respondToFeedback } from '../../services/AdminService';
import '../../styles/AdminFeedback.css';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFeedbacks();
  }, [filter]);

  const loadFeedbacks = async () => {
    try {
      setIsLoading(true);
      const feedbacksList = await getFeedbacks(filter === 'all' ? null : filter);
      setFeedbacks(feedbacksList);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      toast.error('Failed to load feedbacks: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (feedbackId) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setIsResponding(true);
      await respondToFeedback(feedbackId, {
        response: responseText.trim(),
        respondedBy: 'admin'
      });
      
      await loadFeedbacks();
      setSelectedFeedback(null);
      setResponseText('');
      toast.success('Response sent successfully');
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setIsResponding(false);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await respondToFeedback(feedbackId, {
          status: 'deleted',
          response: 'Feedback deleted by admin'
        });
        
        await loadFeedbacks();
        setSelectedFeedback(null);
        toast.success('Feedback deleted successfully');
      } catch (error) {
        toast.error('Failed to delete feedback');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getFilteredFeedbacks = () => {
    if (!feedbacks || feedbacks.length === 0) {
      return [];
    }

    let filtered = feedbacks;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(f => 
        filter === 'unread' ? (f.status === 'unread' || f.status === 'pending') :
        filter === 'read' ? f.status === 'reviewed' : true
      );
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(f => 
        (f.userName || '').toLowerCase().includes(searchLower) ||
        (f.comment || f.message || '').toLowerCase().includes(searchLower) ||
        (f.adminResponse?.response || '').toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const getRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar 
        key={index}
        className={`star ${index < rating ? 'filled' : ''}`}
        size={18}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <FiLoader className="loading-spinner" />
        <p>Loading feedbacks...</p>
      </div>
    );
  }

  const filteredFeedbacks = getFilteredFeedbacks();

  return (
    <div className="admin-feedback">
      <div className="feedback-header">
        <div className="header-content">
          <h2>
            <FiMessageCircle className="header-icon" />
            User Feedback
          </h2>
          <p className="header-subtitle">Manage and respond to user feedback</p>
        </div>

        <div className="feedback-filters">
          <div className="search-box">
            <FiMessageSquare className="search-icon" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-wrapper">
              <label>
                <FiFilter className="filter-icon" />
                Filter by Status
              </label>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  <FiMessageCircle /> All
                </button>
                <button 
                  className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                  onClick={() => setFilter('unread')}
                >
                  <FiAlertCircle /> Unread
                </button>
                <button 
                  className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                  onClick={() => setFilter('read')}
                >
                  <FiCheck /> Read
                </button>
              </div>
            </div>

            <button className="refresh-btn" onClick={loadFeedbacks}>
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </div>

      <div className="feedback-list">
        {filteredFeedbacks.length === 0 ? (
          <div className="no-feedback">
            <FiMessageCircle className="no-feedback-icon" />
            <p>No feedback found</p>
            <p className="no-feedback-subtitle">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredFeedbacks.map(feedback => (
            <div 
              key={feedback.id} 
              className={`feedback-card ${(feedback.status === 'unread' || feedback.status === 'pending') ? 'unread' : ''}`}
              onClick={() => setSelectedFeedback(feedback)}
            >
              <div className="feedback-card-header">
                <div className="user-info">
                  <div className="user-avatar">
                    <FiUser />
                  </div>
                  <div className="user-details">
                    <h3>{feedback.userName || 'Anonymous User'}</h3>
                    <span className="feedback-date">
                      <FiCalendar />
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="feedback-rating">
                  {getRatingStars(feedback.rating || 0)}
                </div>
              </div>

              <div className="feedback-content">
                <FiMessageSquare className="content-icon" />
                <p>{feedback.comment || feedback.message || 'No message'}</p>
              </div>

              {feedback.adminResponse && (
                <div className="admin-response">
                  <div className="response-header">
                    <FiThumbsUp className="response-icon" />
                    <span>Admin Response</span>
                  </div>
                  <p>{feedback.adminResponse.response}</p>
                  <span className="response-date">
                    {new Date(feedback.adminResponse.respondedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {(feedback.status === 'unread' || feedback.status === 'pending') && (
                <div className="feedback-status unread-badge">
                  <FiAlertCircle /> Unread
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedFeedback && (
        <div className="feedback-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Respond to Feedback</h3>
              <button className="close-button" onClick={() => setSelectedFeedback(null)}>
                <FiX />
              </button>
            </div>

            <div className="feedback-details">
              <div className="detail-card">
                <h4>
                  <FiUser className="detail-icon" />
                  User Information
                </h4>
                <p><strong>Name:</strong> {selectedFeedback.userName || 'Anonymous'}</p>
                <p><strong>Date:</strong> {new Date(selectedFeedback.createdAt).toLocaleDateString()}</p>
                <p><strong>Rating:</strong> {getRatingStars(selectedFeedback.rating)}</p>
              </div>

              <div className="detail-card">
                <h4>
                  <FiMessageSquare className="detail-icon" />
                  Feedback Content
                </h4>
                <p>{selectedFeedback.comment || selectedFeedback.message}</p>
              </div>

              {selectedFeedback.adminResponse && (
                <div className="detail-card">
                  <h4>
                    <FiThumbsUp className="detail-icon" />
                    Previous Response
                  </h4>
                  <p>{selectedFeedback.adminResponse.response}</p>
                  <small>
                    Responded on: {new Date(selectedFeedback.adminResponse.respondedAt).toLocaleDateString()}
                  </small>
                </div>
              )}
            </div>

            <div className="response-section">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter your response..."
                rows="4"
                className="response-textarea"
              />
              <div className="modal-actions">
                <button 
                  className="respond-button"
                  onClick={() => handleRespond(selectedFeedback.id)}
                  disabled={isResponding || !responseText.trim()}
                >
                  {isResponding ? (
                    <>
                      <FiLoader className="button-spinner" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      Send Response
                    </>
                  )}
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(selectedFeedback.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <FiLoader className="button-spinner" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 />
                      Delete Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;