const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Update the Maps API endpoint with rate limiting
const mapApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Google Maps API key endpoint
app.get('/api/maps/key', (req, res) => {
  const allowedOrigins = ['http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Unauthorized origin' });
  }

  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// ToyyibPay API endpoint
app.post('/api/toyyibpay/create-bill', async (req, res) => {
  const { orderId, fullName, email, phone, amount } = req.body;

  try {
    const response = await fetch('https://toyyibpay.com/index.php/api/createBill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        userSecretKey: process.env.TOYYIBPAY_SECRET_KEY,
        categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE,
        billName: `Order #${orderId}`,
        billDescription: 'Payment for your order',
        billPriceSetting: 1,
        billPayorInfo: 1,
        billAmount: (amount * 100).toString(),
        billReturnUrl: 'http://localhost:3000/dashboard/user/orders',
        billCallbackUrl: 'http://localhost:5000/api/toyyibpay/callback',
        billTo: fullName,
        billEmail: email,
        billPhone: phone
      })
    });

    const result = await response.json();

    if (result[0]?.BillCode) {
      res.json({ success: true, billCode: result[0].BillCode });
    } else {
      throw new Error('Failed to create ToyyibPay bill');
    }
  } catch (error) {
    console.error('ToyyibPay error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ToyyibPay Callback Endpoint
app.post('/api/toyyibpay/callback', (req, res) => {
  const { billcode, status_id } = req.body;

  // Log the callback data for debugging
  console.log('ToyyibPay Callback:', req.body);

  // Update order status in your database based on the billcode and status_id
  if (status_id === '1') {
    console.log(`Payment successful for billcode: ${billcode}`);
    // Update the order status in Firestore or your database to "Paid"
  } else {
    console.log(`Payment failed for billcode: ${billcode}`);
    // Update the order status in Firestore or your database to "Failed"
  }

  // Respond to ToyyibPay to acknowledge the callback
  res.sendStatus(200);
});

// Create HTTP server and wrap Express app
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow your frontend
    methods: ["GET", "POST"]
  }
});

// Listen for WebSocket connections
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // Example: Listen for a test event
  socket.on('test', (data) => {
    console.log('Received test event:', data);
    // You can emit events back to clients like this:
    // socket.emit('test-response', { message: 'Hello from server!' });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server (use server.listen, not app.listen)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});