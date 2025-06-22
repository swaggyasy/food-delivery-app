import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { sendOrderNotification } from '../utils/telegramNotifications';
import { toast } from 'react-toastify';
import '../styles/PaymentSuccessPage.css';
import { FiCheckCircle, FiLoader, FiAlertCircle } from 'react-icons/fi';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { dispatch } = useCart();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Retrieve pending order from local storage
        const pendingOrder = JSON.parse(localStorage.getItem('pending_order'));
        
        if (!pendingOrder) {
          throw new Error('No pending order found. Your session may have expired.');
        }

        // Add a small delay to ensure all services are ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create the final order data
        const orderData = {
          ...pendingOrder,
          status: 'pending', // Update status from 'pending_payment'
          paymentStatus: 'paid',
          createdAt: new Date().toISOString(), // Use current time
        };

        // Save order to Firestore
        const ordersRef = collection(db, 'orders');
        const docRef = await addDoc(ordersRef, orderData);
        orderData.id = docRef.id;

        // Send Telegram notification
        await sendOrderNotification(orderData);

        // Clear the cart
        dispatch({ type: 'CLEAR_CART' });

        // Remove the pending order from local storage
        localStorage.removeItem('pending_order');

        // Update status to success
        setStatus('success');
        toast.success('Your order has been confirmed!');
        
        // Redirect to the orders page after a delay
        setTimeout(() => {
          navigate('/dashboard/orders');
        }, 3000);

      } catch (err) {
        console.error('Error processing payment success:', err);
        setError(err.message || 'An unexpected error occurred.');
        setStatus('error');
        toast.error('Failed to confirm your order. Please contact support.');
      }
    };

    processPayment();
  }, [dispatch, navigate]);

  return (
    <div className="payment-success-container">
      <div className="payment-status-box">
        {status === 'processing' && (
          <>
            <FiLoader className="status-icon processing" />
            <h2>Processing Your Order...</h2>
            <p>Please wait while we confirm your payment and create your order.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <FiCheckCircle className="status-icon success" />
            <h2>Payment Successful!</h2>
            <p>Your order has been placed. You will be redirected to your orders page shortly.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <FiAlertCircle className="status-icon error" />
            <h2>Order Confirmation Failed</h2>
            <p>{error}</p>
            <p>Please contact our support team with your payment details.</p>
            <button onClick={() => navigate('/contact-us')} className="contact-support-btn">
              Contact Support
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage; 