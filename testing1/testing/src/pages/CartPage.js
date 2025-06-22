import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiTrash2, FiArrowLeft, FiPackage, FiMinus, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import '../styles/CartPage.css';

const CartPage = () => {
  const { state, dispatch } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);
    
    if (user?.email) {
      loadOrders(user.email);
    }
  }, []);

  const loadOrders = (email) => {
    try {
      if (!email) {
        console.warn('No email available to load orders');
        return;
      }

      const allOrders = JSON.parse(localStorage.getItem('userOrders') || '{}');
      const userOrders = allOrders[email] || [];
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load order history');
    }
  };

  const calculateTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!state.items || state.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      localStorage.setItem('pendingCart', JSON.stringify(state.items));
      navigate('/checkout');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  const removeFromCart = (itemId) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: itemId
    });
    toast.success('Item removed from cart');
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: {
        id: itemId,
        quantity: newQuantity
      }
    });
  };

  if (!state.items || state.items.length === 0) {
    return (
      <div className="empty-cart-container">
        <div className="empty-cart-content">
          <FiShoppingCart className="empty-cart-icon" />
          <h2>Your Cart is Empty</h2>
          <p>Time to fill it with delicious frozen goods!</p>
          <button 
            className="browse-products-btn" 
            onClick={() => navigate('/dashboard/products')}
          >
            <FiArrowLeft /> Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      <div className="cart-page-container">
        <div className="cart-header">
          <h2>Your Shopping Cart</h2>
          <span className="cart-count">{state.items.length} items</span>
        </div>

        <div className="cart-content">
          <div className="cart-items-section">
            {state.items.map((item) => (
              <div key={item.id} className="cart-item-card">
                <div className="item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="item-icon">
                      <FiPackage />
                    </div>
                  )}
                </div>
                <div className="item-details">
                  <div className="item-header">
                    <h3>{item.name}</h3>
                    <button 
                      className="remove-item-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <div className="item-info">
                    <div className="item-pricing">
                      <p className="price-per-unit">
                        RM {parseFloat(item.price).toFixed(2)} per {item.unit || 'unit'}
                      </p>
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= (item.minOrder || 0.5)}
                        >
                          <FiMinus />
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <FiPlus />
                        </button>
                      </div>
                    </div>
                    {item.customization && (
                      <div className="customization-info">
                        <span className="customization-label">Special Instructions:</span>
                        <p className="customization-text">{item.customization}</p>
                      </div>
                    )}
                  </div>
                  <div className="item-total">
                    <span>Total:</span>
                    <span className="total-amount">
                      RM {(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary-section">
            <div className="summary-card">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {state.items.map(item => (
                  <div key={item.id} className="summary-item">
                    <div className="summary-item-details">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="summary-item-image"
                        />
                      )}
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">
                        {item.quantity} {item.unit || 'unit(s)'}
                      </span>
                    </div>
                    <span className="item-price">
                      RM {(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="summary-divider"></div>
              <div className="summary-total">
                <span>Subtotal</span>
                <span className="total-price">RM {calculateTotal().toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>RM 10.00</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span className="total-price">RM {(calculateTotal() + 10).toFixed(2)}</span>
              </div>
              <button 
                className={`checkout-btn ${!currentUser ? 'disabled' : ''}`}
                onClick={handleCheckout}
                disabled={state.items.length === 0 || isProcessing || !currentUser}
              >
                {!currentUser ? (
                  <span className="login-required">Please Login to Checkout</span>
                ) : isProcessing ? (
                  'Processing...'
                ) : (
                  'Proceed to Checkout'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;