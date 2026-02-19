import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { orderRateLimiter } from '../middleware/rateLimiter';

interface CreateOrderData {
  amountClp: number;
}

/**
 * Callable function to create order
 * Enforces business logic and validation server-side
 */
export const createOrder = functions.https.onCall(async (data: CreateOrderData, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = context.auth.uid;
  const { amountClp } = data;

  // Rate limiting (max 5 orders per minute)
  if (await orderRateLimiter.checkLimit(userId)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many orders. Please wait.');
  }

  // Validation
  if (!amountClp || amountClp <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
  }

  if (amountClp < 1000) {
    throw new functions.https.HttpsError('invalid-argument', 'Minimum amount is 1,000 CLP');
  }
  
  // Max amount validation (prevent abuse)
  if (amountClp > 10000000) { // 10 million CLP
    throw new functions.https.HttpsError('invalid-argument', 'Amount exceeds maximum limit');
  }

  try {
    const db = admin.firestore();

    // Get user profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found');
    }

    const userData = userDoc.data()!;

    // Get current rate
    const rateDoc = await db.collection('rates').doc('current').get();
    if (!rateDoc.exists) {
      throw new functions.https.HttpsError('failed-precondition', 'Exchange rate not configured');
    }

    const rateData = rateDoc.data()!;
    const clpToVes = rateData.clpToVes;

    // Calculate VES amount
    const amountVesExpected = amountClp * clpToVes;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const orderRef = await db.collection('orders').add({
      orderNumber,
      customerId: userId,
      customerName: userData.fullName,
      customerEmail: userData.email,
      amountClp,
      rateSnapshot: clpToVes,
      amountVesExpected,
      status: 'created',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create initial event
    await db.collection('orders').doc(orderRef.id).collection('events').add({
      fromStatus: null,
      toStatus: 'created',
      changedBy: userId,
      changedByName: userData.fullName,
      note: 'Pedido creado',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      orderId: orderRef.id,
      orderNumber,
      amountVesExpected,
    };
  } catch (error: any) {
    console.error('Error creating order:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create order');
  }
});
