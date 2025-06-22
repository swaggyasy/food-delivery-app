import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AboutUs.css';
import { FiMapPin, FiClock, FiAward, FiUsers, FiTruck, FiStar, FiArrowRight } from 'react-icons/fi';
import ImageSlider from '../components/ImageSlider';

const AboutUsPage = () => {
  const navigate = useNavigate();
  const sliderImages = [
    {
      url: '/images/wallpaper1.jpeg',
      title: 'Premium Frozen Foods',
      description: 'Exceptional quality, delivered to your doorstep'
    },
    {
      url: '/images/wallpaper2.jpeg',
      title: 'State-of-the-Art Facilities',
      description: 'Modern storage and handling systems'
    },
    {
      url: '/images/wallpaper3.jpeg',
      title: 'Expert Team',
      description: 'Dedicated professionals at your service'
    }
  ];

  const stats = [
    { number: '10+', label: 'Years Experience', icon: <FiClock /> },
    { number: '1000+', label: 'Happy Customers', icon: <FiUsers /> },
    { number: '500+', label: 'Products', icon: <FiStar /> },
    { number: '24/7', label: 'Support', icon: <FiTruck /> }
  ];

  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach((element) => {
      observerRef.current.observe(element);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleExploreProducts = () => {
    navigate('/dashboard/products');
  };

  const handleContactUs = () => {
    navigate('/dashboard/contact');
  };

  return (
    <div className="about-container">
      <div className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">Tanjong</span> Frozen Food
          </h1>
          <p className="hero-subtitle">Redefining Quality in Frozen Foods</p>
          <div className="hero-buttons">
            <button onClick={handleExploreProducts} className="hero-button primary">
              Explore Products <FiArrowRight className="button-icon" />
            </button>
            <button onClick={handleContactUs} className="hero-button secondary">
              Contact Us
            </button>
          </div>
        </div>
      </div>

      <div className="slider-section">
        <ImageSlider images={sliderImages} />
      </div>

      <div className="about-content">
        <div className="vision-section animate-on-scroll">
          <div className="section-header">
            <span className="section-tag">Our Vision</span>
            <h2>Leading the Future of <span className="gradient-text">Frozen Foods</span></h2>
          </div>
          <p className="section-description">
            Since 2022, we've been revolutionizing the frozen food industry with innovative solutions 
            and unwavering commitment to quality. Our journey from a family business to an industry 
            leader is built on trust, excellence, and continuous innovation.
          </p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card animate-on-scroll">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="features-section">
          <div className="section-header animate-on-scroll">
            <span className="section-tag">Why Choose Us</span>
            <h2>Experience the <span className="gradient-text">Difference</span></h2>
          </div>
          
          <div className="features-grid">
            <div className="stat-card animate-on-scroll">
              <div className="stat-icon">
                <FiAward />
              </div>
              <div className="stat-number">Premium</div>
              <div className="stat-label">Quality</div>
            </div>

            <div className="stat-card animate-on-scroll">
              <div className="stat-icon">
                <FiTruck />
              </div>
              <div className="stat-number">Swift</div>
              <div className="stat-label">Delivery</div>
            </div>

            <div className="stat-card animate-on-scroll">
              <div className="stat-icon">
                <FiMapPin />
              </div>
              <div className="stat-number">Wide</div>
              <div className="stat-label">Coverage</div>
            </div>
          </div>
        </div>

        <div className="mission-section animate-on-scroll">
          <div className="section-header">
            <span className="section-tag">Our Mission</span>
            <h2>Committed to <span className="gradient-text">Excellence</span></h2>
          </div>
          <div className="mission-content">
            <p className="section-description">
              At Tanjong Frozen Food, we're dedicated to revolutionizing the frozen food industry 
              through innovation, sustainability, and exceptional service. Our commitment extends 
              beyond products to creating lasting relationships with our customers and community.
            </p>
            <div className="mission-values">
              <div className="value-item">
                <FiStar className="value-icon" />
                <h4>Quality First</h4>
                <p>Premium products, carefully selected</p>
              </div>
              <div className="value-item">
                <FiUsers className="value-icon" />
                <h4>Customer Focus</h4>
                <p>Your satisfaction, our priority</p>
              </div>
              <div className="value-item">
                <FiClock className="value-icon" />
                <h4>Reliability</h4>
                <p>Consistent service excellence</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;