const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 5000; // Use port 5000 for WebSockets

// --- ToyyibPay Configuration ---
// IMPORTANT: Replace with your actual ToyyibPay credentials
const TOYYIBPAY_SECRET_KEY = 'oe2t79vv-dn6e-j2nh-6ewr-hw55nhy57h8a';
const TOYYIBPAY_CATEGORY_CODE = 'ikxjkfik';
const TOYYIBPAY_API_URL = 'https://toyyibpay.com/index.php/api';

// Create HTTP server and wrap Express app
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://projecttff-80675.web.app"], // Allow both local and deployed frontend
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://projecttff-80675.web.app"]
}));
app.use(express.json());

// --- WebSocket Connection Handling ---
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log(`Socket ${socket.id} joined the admin room.`);
  });

  socket.on('join-user-room', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room for user ${userId}.`);
  });

  // Example: Forwarding order updates
  socket.on('order-status-update', (data) => {
    // This can broadcast to admins or a specific user
    const targetRoom = data.isAdminUpdate ? 'admin-room' : data.userId;
    if (targetRoom) {
      io.to(targetRoom).emit('order-updated', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// --- ToyyibPay Bill Creation Endpoint ---
app.post('/api/toyyibpay/create-bill', async (req, res) => {
  try {
    const { fullName, email, phone, amount } = req.body;

    // Validate request body
    if (!fullName || !email || !phone || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const billData = {
      userSecretKey: TOYYIBPAY_SECRET_KEY,
      categoryCode: TOYYIBPAY_CATEGORY_CODE,
      billName: 'FoodApp Order',
      billDescription: `Payment for order by ${fullName}`,
      billPriceSetting: 1, // 1 for fixed price
      billPayorInfo: 1, // 1 to require payor info
      billAmount: Math.round(amount * 100), // Amount in cents
      billReturnUrl: 'https://projecttff-80675.web.app/payment-success',
      billCallbackUrl: `https://projecttff-80675.web.app/api/toyyibpay/callback`,
      billExternalReferenceNo: `ORD-${Date.now()}`,
      billTo: fullName,
      billEmail: email,
      billPhone: phone,
    };

    const response = await fetch(`${TOYYIBPAY_API_URL}/createBill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(billData),
    });

    const result = await response.json();

    if (result && result.length > 0 && result[0].BillCode) {
      res.json({ success: true, billCode: result[0].BillCode });
    } else {
      console.error('ToyyibPay bill creation failed:', result);
      throw new Error('Failed to create ToyyibPay bill');
    }

  } catch (error) {
    console.error('Error creating ToyyibPay bill:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- ToyyibPay Callback Endpoint ---
// This is where ToyyibPay sends the payment status
app.post('/api/toyyibpay/callback', (req, res) => {
  try {
    const { billcode, status } = req.body;

    console.log('--- ToyyibPay Callback Received ---');
    console.log('Bill Code:', billcode);
    console.log('Status:', status); // '1' for success, '3' for failed
    console.log('---------------------------------');
    
    // Here you would typically verify the signature and update the database
    // For now, the frontend handles order creation on the success page.
    
    res.status(200).send('OK');

  } catch (error) {
    console.error('Error handling ToyyibPay callback:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Dashboard Stats Endpoint
app.get('/api/dashboard/stats', (req, res) => {
  const { period } = req.query;
  
  // TODO: Replace with actual database queries
  const stats = {
    totalUsers: 150,
    totalProducts: 75,
    ordersToday: 25,
    totalRevenue: 15250.50,
    usersTrend: "+12%",
    productsTrend: "+5%",
    ordersTrend: "+18%",
    revenueTrend: "+25%"
  };

  res.json(stats);
});

// Recent Orders Endpoint
app.get('/api/dashboard/recent-orders', (req, res) => {
  const { limit = 5 } = req.query;

  // TODO: Replace with actual database queries
  const recentOrders = [
    {
      id: "ORD123",
      customerName: "John Doe",
      email: "john@example.com",
      date: new Date().toISOString(),
      total: 150.50,
      status: "Completed"
    },
    {
      id: "ORD124",
      customerName: "Jane Smith",
      email: "jane@example.com",
      date: new Date().toISOString(),
      total: 245.00,
      status: "Processing"
    }
    // Add more sample orders as needed
  ];

  res.json(recentOrders.slice(0, limit));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Use server.listen instead of app.listen
server.listen(port, () => {
  console.log(`Server with WebSockets running on port ${port}`);
}); 