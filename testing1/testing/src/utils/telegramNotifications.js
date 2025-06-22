// Telegram Bot configuration
const TELEGRAM_BOT_TOKEN = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.REACT_APP_TELEGRAM_CHAT_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Send notification to Telegram
 * @param {Object} order - The order details
 * @returns {Promise} - The response from Telegram API
 */
export const sendOrderNotification = async (order) => {
  try {
    const message = formatOrderMessage(order);
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
};

/**
 * Format order details for Telegram message
 * @param {Object} order - The order details
 * @returns {String} - Formatted message
 */
const formatOrderMessage = (order) => {
  const orderDate = new Date(order.date).toLocaleString();
  const items = order.items
    .map(item => `• ${item.name} x${item.quantity} - RM${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  return `
🛍️ <b>New Order Received!</b>

📦 Order #${order.id}
📅 Date: ${orderDate}
👤 Customer: ${order.customerName}
📞 Phone: ${order.phone}
📍 Address: ${order.address}

🛒 <b>Order Items:</b>
${items}

💰 <b>Total Amount:</b> RM${order.total.toFixed(2)}
🚚 Delivery Type: ${order.deliveryType}
💳 Payment Method: ${order.paymentMethod}

<i>Please process this order as soon as possible.</i>
`;
};

/**
 * Send cancellation notification to Telegram
 * @param {Object} order - The order details
 * @param {String} reason - Cancellation reason
 * @returns {Promise} - The response from Telegram API
 */
export const sendCancellationNotification = async (order, reason) => {
  try {
    const message = formatCancellationMessage(order, reason);
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    throw error;
  }
};

/**
 * Format cancellation message for Telegram
 * @param {Object} order - The order details
 * @param {String} reason - Cancellation reason
 * @returns {String} - Formatted message
 */
const formatCancellationMessage = (order, reason) => {
  const cancellationDate = new Date().toLocaleString();
  const items = order.items
    .map(item => `• ${item.name} x${item.quantity} - RM${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  return `
❌ <b>Order Cancelled</b>

📦 Order #${order.id}
👤 Customer: ${order.customerName || 'N/A'}
📞 Phone: ${order.phone || 'N/A'}
📍 Address: ${order.address || 'N/A'}

🛒 <b>Cancelled Items:</b>
${items}

💰 <b>Total Amount:</b> RM${order.total.toFixed(2)}
❓ <b>Cancellation Reason:</b> ${reason}
⏰ <b>Cancelled at:</b> ${cancellationDate}
`;
};

/**
 * Test the Telegram bot connection
 * @returns {Promise} - The response from Telegram API
 */
export const testTelegramConnection = async () => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error testing Telegram connection:', error);
    throw error;
  }
}; 