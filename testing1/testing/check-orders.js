const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'projecttff-80675'
});

const db = admin.firestore();

async function checkOrders() {
  try {
    console.log('Checking all orders in the database...');
    
    // Get all orders
    const ordersSnapshot = await db.collection('orders').get();
    
    if (ordersSnapshot.empty) {
      console.log('No orders found in the database.');
      return;
    }
    
    console.log(`Found ${ordersSnapshot.size} total orders.`);
    
    const ordersByUser = {};
    const ordersWithoutUserId = [];
    const ordersWithWrongUserId = [];
    
    ordersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const orderId = doc.id;
      
      console.log(`Order ${orderId}:`, {
        userId: data.userId || 'MISSING',
        email: data.email || 'MISSING',
        customerName: data.customerName || 'MISSING',
        status: data.status || 'MISSING',
        createdAt: data.createdAt ? 'EXISTS' : 'MISSING'
      });
      
      if (!data.userId) {
        ordersWithoutUserId.push({
          id: orderId,
          email: data.email,
          customerName: data.customerName
        });
      } else {
        if (!ordersByUser[data.userId]) {
          ordersByUser[data.userId] = [];
        }
        ordersByUser[data.userId].push({
          id: orderId,
          email: data.email,
          customerName: data.customerName
        });
      }
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total orders: ${ordersSnapshot.size}`);
    console.log(`Orders without userId: ${ordersWithoutUserId.length}`);
    console.log(`Orders with userId: ${ordersSnapshot.size - ordersWithoutUserId.length}`);
    
    if (ordersWithoutUserId.length > 0) {
      console.log('\n=== ORDERS WITHOUT USER ID ===');
      ordersWithoutUserId.forEach(order => {
        console.log(`- Order ${order.id}: ${order.customerName} (${order.email})`);
      });
    }
    
    console.log('\n=== ORDERS BY USER ===');
    Object.keys(ordersByUser).forEach(userId => {
      console.log(`User ${userId}: ${ordersByUser[userId].length} orders`);
      ordersByUser[userId].forEach(order => {
        console.log(`  - Order ${order.id}: ${order.customerName} (${order.email})`);
      });
    });
    
  } catch (error) {
    console.error('Error checking orders:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkOrders(); 