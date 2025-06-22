import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';
import '../styles/ErrorBoundary.css';

const ErrorBoundary = () => {
  const error = useRouteError();

  return (
    <div className="error-container">
      <div className="error-content">
        <FiAlertTriangle className="error-icon" />
        <h1>Oops! Something went wrong</h1>
        <p>{error?.message || "The page you're looking for cannot be found."}</p>
        <Link to="/" className="home-link">
          <FiHome /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default ErrorBoundary;