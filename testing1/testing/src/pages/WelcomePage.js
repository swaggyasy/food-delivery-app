import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiTruck, FiClock, FiStar, FiArrowRight } from 'react-icons/fi';
import '../styles/WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  return (
    <div className="welcome-page">
      {/* Animated Background */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
      </div>

      {/* Main Content */}
      <main className="welcome-main">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="highlight">Tanjong</span>
              <br />
              Frozen Food
            </h1>
            <p className="hero-subtitle">
              Your trusted source for quality frozen food products. 
              Fresh, convenient, and delivered right to your doorstep.
            </p>
            
            <div className="cta-buttons">
              <button className="cta-btn primary" onClick={handleLoginClick}>
                <span>Login to Get Your Order</span>
                <FiArrowRight className="arrow-icon" />
              </button>
              <button className="cta-btn secondary" onClick={handleSignupClick}>
                Create Account
              </button>
            </div>
          </div>

          <div className="hero-image">
            <div className="image-container">
              <div className="floating-card card-1">
                <FiShoppingBag className="card-icon" />
                <span>Fresh Food</span>
              </div>
              <div className="floating-card card-2">
                <FiTruck className="card-icon" />
                <span>Fast Delivery</span>
              </div>
              <div className="floating-card card-3">
                <FiClock className="card-icon" />
                <span>Quick Service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">Why Choose Tanjong Frozen Food?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FiShoppingBag />
              </div>
              <h3>Wide Selection</h3>
              <p>Choose from hundreds of delicious frozen food products</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiTruck />
              </div>
              <h3>Fast Delivery</h3>
              <p>Get your frozen food delivered in 30 minutes or less</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiStar />
              </div>
              <h3>Best Quality</h3>
              <p>Only the finest frozen food products with premium quality</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiClock />
              </div>
              <h3>5AM - 7PM Everyday</h3>
              <p>Order anytime, day or night</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="welcome-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Tanjong Frozen Food</h4>
            <p>Your trusted frozen food partner</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><button onClick={handleLoginClick}>Login</button></li>
              <li><button onClick={handleSignupClick}>Sign Up</button></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: asyraafhairol7@gmail.com</p>
            <p>Phone: +60 14-277 5103</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Tanjong Frozen Food. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage; 