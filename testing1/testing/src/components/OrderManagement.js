import React, { useState } from 'react';
import { updateOrderStatus, ORDER_STATUS } from '../services/OrderService';
import { 
  FiTruck, 
  FiCheck, 
  FiX, 
  FiPackage, 
  FiAlertCircle, 
  FiPrinter,
  FiClock,
  FiDollarSign
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const OrderManagement = ({ order }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleStatusUpdate = async (newStatus, additionalData = {}) => {
    setIsLoading(true);
    try {
      await updateOrderStatus(order.id, newStatus, additionalData);
      toast.success(`Order successfully marked as ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error(`Error updating order to ${newStatus}:`, error);
      toast.error('Failed to update order status');
    }
    setIsLoading(false);
    if (showCancelModal) setShowCancelModal(false);
  };

  const handleCancelSubmit = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    handleStatusUpdate(ORDER_STATUS.CANCELLED, { cancelReason });
  };

  const handlePrintReceipt = () => {
    const receiptContent = `
      <html>
        <head>
          <title>Order Receipt #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .order-info { margin-bottom: 20px; }
            .items { margin-bottom: 30px; }
            .total { text-align: right; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Receipt</h1>
            <p>Order #${order.id}</p>
            <p>${new Date(order.createdAt?.toDate()).toLocaleString()}</p>
          </div>
          <div class="order-info">
            <h2>Order Details</h2>
            <p>Status: ${order.status}</p>
            ${order.trackingNumber ? `<p>Tracking: ${order.trackingNumber}</p>` : ''}
          </div>
          <div class="items">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="total">
            <p>Total: $${order.totalAmount?.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
  };

  const StatusButton = ({ icon, label, color, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-lg
        transition-all duration-200 ease-in-out w-full
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'}
        ${color === 'blue' && 'bg-blue-500 hover:bg-blue-600 text-white'}
        ${color === 'green' && 'bg-green-500 hover:bg-green-600 text-white'}
        ${color === 'red' && 'bg-red-500 hover:bg-red-600 text-white'}
        ${color === 'yellow' && 'bg-yellow-500 hover:bg-yellow-600 text-white'}
        ${color === 'gray' && 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
      `}
    >
      {isLoading ? (
        <div className="loading-spinner" />
      ) : (
        <>
          {icon}
          <span className="font-medium">{label}</span>
        </>
      )}
    </button>
  );

  const CancelModal = () => (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="modal-content bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-xl font-semibold mb-4">Cancel Order</h3>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Please provide a reason for cancellation..."
          className="w-full p-3 border rounded-lg mb-4 h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowCancelModal(false)}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={handleCancelSubmit}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
          >
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Order Header */}
      <div className="mb-8 border-b pb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order #{order.id}</h2>
            <p className="text-gray-600 flex items-center gap-2">
              <FiClock className="inline" />
              {new Date(order.createdAt?.toDate()).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-800 flex items-center justify-end gap-2">
              <FiDollarSign className="inline" />
              ${order.totalAmount?.toFixed(2)}
            </p>
            <p className={`
              mt-2 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1
              ${order.status === ORDER_STATUS.DELIVERED ? 'bg-green-100 text-green-800' : ''}
              ${order.status === ORDER_STATUS.CANCELLED ? 'bg-red-100 text-red-800' : ''}
              ${order.status === ORDER_STATUS.PROCESSING ? 'bg-yellow-100 text-yellow-800' : ''}
              ${order.status === ORDER_STATUS.SHIPPED ? 'bg-blue-100 text-blue-800' : ''}
              ${order.status === ORDER_STATUS.PLACED ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              <FiAlertCircle className="inline" />
              {order.status}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Order Actions</h3>
          <StatusButton
            icon={<FiPackage className="text-xl" />}
            label="Process Order"
            color="yellow"
            onClick={() => handleStatusUpdate(ORDER_STATUS.PROCESSING)}
            disabled={order.status !== ORDER_STATUS.PLACED}
          />
          <StatusButton
            icon={<FiTruck className="text-xl" />}
            label="Mark as Shipped"
            color="blue"
            onClick={() => handleStatusUpdate(ORDER_STATUS.SHIPPED, {
              trackingNumber: 'TRACK123'
            })}
            disabled={order.status !== ORDER_STATUS.PROCESSING}
          />
          <StatusButton
            icon={<FiCheck className="text-xl" />}
            label="Mark as Delivered"
            color="green"
            onClick={() => handleStatusUpdate(ORDER_STATUS.DELIVERED)}
            disabled={order.status !== ORDER_STATUS.SHIPPED}
          />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Additional Actions</h3>
          <StatusButton
            icon={<FiPrinter className="text-xl" />}
            label="Print Receipt"
            color="gray"
            onClick={handlePrintReceipt}
            disabled={false}
          />
          <StatusButton
            icon={<FiX className="text-xl" />}
            label="Cancel Order"
            color="red"
            onClick={() => setShowCancelModal(true)}
            disabled={['DELIVERED', 'CANCELLED'].includes(order.status)}
          />
        </div>
      </div>

      {/* Order Details Card */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Order Status Details</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <FiAlertCircle />
            <span className="font-medium">
              {order.status === ORDER_STATUS.PLACED && 'Order received, awaiting processing'}
              {order.status === ORDER_STATUS.PROCESSING && 'Order is being prepared for shipping'}
              {order.status === ORDER_STATUS.SHIPPED && 'Package is in transit'}
              {order.status === ORDER_STATUS.DELIVERED && 'Order has been successfully delivered'}
              {order.status === ORDER_STATUS.CANCELLED && 'Order has been cancelled'}
            </span>
          </div>
          {order.trackingNumber && (
            <div className="flex items-center gap-2 text-gray-600">
              <FiTruck />
              <span>Tracking Number: {order.trackingNumber}</span>
            </div>
          )}
          {order.status === ORDER_STATUS.CANCELLED && order.cancelReason && (
            <div className="flex items-center gap-2 text-red-600">
              <FiX />
              <span>Cancellation Reason: {order.cancelReason}</span>
            </div>
          )}
        </div>
      </div>

      {showCancelModal && <CancelModal />}
    </div>
  );
};

export default OrderManagement; 