import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface AttachVesReceiptData {
  orderId: string;
  receiptUrl: string;
}

/**
 * Callable function to attach VES receipt
 * Only admins can call this function
 */
export const attachVesReceipt = functions.https.onCall(
  async (data: AttachVesReceiptData, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    // Verify admin claim
    if (!context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can attach VES receipt');
    }

    const { orderId, receiptUrl } = data;

    if (!orderId || !receiptUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId and receiptUrl required');
    }

    try {
      const db = admin.firestore();
      const orderRef = db.collection('orders').doc(orderId);

      // Verify order exists
      const orderDoc = await orderRef.get();
      if (!orderDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Order not found');
      }

      // Update order with VES receipt
      await orderRef.update({
        vesReceiptUrl: receiptUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: 'VES receipt attached successfully',
      };
    } catch (error: any) {
      console.error('Error attaching VES receipt:', error);
      throw new functions.https.HttpsError('internal', error.message || 'Failed to attach receipt');
    }
  }
);
