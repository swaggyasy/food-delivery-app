const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'projecttff-80675'
});

const db = admin.firestore();

async function updateOrderTimestamps() {
  try {
    console.log('Starting timestamp update process...');
    
    // Get all orders
    const ordersSnapshot = await db.collection('orders').get();
    
    if (ordersSnapshot.empty) {
      console.log('No orders found in the database.');
      return;
    }
    
    console.log(`Found ${ordersSnapshot.size} orders to update.`);
    
    const batch = db.batch();
    let updateCount = 0;
    
    ordersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const updates = {};
      
      // Helper function to convert string to Timestamp
      const convertToTimestamp = (field) => {
        if (!field) return null;
        if (typeof field === 'string') {
          return Timestamp.fromDate(new Date(field));
        }
        if (field instanceof Date) {
          return Timestamp.fromDate(field);
        }
        if (field && typeof field === 'object' && field.toDate) {
          // Already a Firestore Timestamp
          return field;
        }
        return null;
      };
      
      // Update createdAt
      if (data.createdAt) {
        const newCreatedAt = convertToTimestamp(data.createdAt);
        if (newCreatedAt) {
          updates.createdAt = newCreatedAt;
        }
      }
      
      // Update updatedAt
      if (data.updatedAt) {
        const newUpdatedAt = convertToTimestamp(data.updatedAt);
        if (newUpdatedAt) {
          updates.updatedAt = newUpdatedAt;
        }
      }
      
      // Update cancelledAt
      if (data.cancelledAt) {
        const newCancelledAt = convertToTimestamp(data.cancelledAt);
        if (newCancelledAt) {
          updates.cancelledAt = newCancelledAt;
        }
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        updateCount++;
        console.log(`Order ${doc.id}: Converting timestamps...`);
      }
    });
    
    if (updateCount > 0) {
      console.log(`Committing ${updateCount} updates...`);
      await batch.commit();
      console.log('✅ Successfully updated all order timestamps!');
    } else {
      console.log('No timestamp updates needed.');
    }
    
  } catch (error) {
    console.error('Error updating timestamps:', error);
  } finally {
    process.exit(0);
  }
}

// Run the update
updateOrderTimestamps(); 