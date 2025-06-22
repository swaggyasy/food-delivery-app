import React from 'react';
import { FiPrinter } from 'react-icons/fi';

const PrintReceipt = ({ order }) => {
  const printContent = () => {
    const receiptWindow = window.open('', '_blank');
    const orderDate = order.date || order.createdAt || new Date();
    
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt #${order.id.slice(-5)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .order-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table th, .items-table td { padding: 8px; border-bottom: 1px solid #ddd; }
            .total { margin-top: 20px; text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Order Receipt</h2>
            <p>Order #${order.id.slice(-5)}</p>
            <p>Date: ${new Date(orderDate).toLocaleDateString()}</p>
          </div>
          
          <div class="order-info">
            <p>Status: ${order.status}</p>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => {
                const price = Number(item.price);
                const quantity = Number(item.quantity);
                const subtotal = price * quantity;
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${quantity}</td>
                    <td>RM ${price.toFixed(2)}</td>
                    <td>RM ${subtotal.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="total">
            <p>Total: RM ${Number(order.total).toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
    
    receiptWindow.document.close();
    receiptWindow.print();
  };

  return (
    <button className="action-btn print-btn" onClick={printContent} title="Print Receipt">
      <FiPrinter style={{ marginRight: 6 }} />
      Print
    </button>
  );
};

export default PrintReceipt;