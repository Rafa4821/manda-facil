import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { defaultRateLimiter } from '../middleware/rateLimiter';
import { auditLogger } from '../middleware/auditLogger';

interface UpdateOrderStatusData {
  orderId: string;
  newStatus: string;
  note?: string;
}

type OrderStatus =
  | 'created'
  | 'clp_receipt_uploaded'
  | 'clp_verified'
  | 'processing'
  | 'paid_out'
  | 'completed'
  | 'rejected'
  | 'cancelled';

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  created: ['clp_receipt_uploaded', 'cancelled'],
  clp_receipt_uploaded: ['clp_verified', 'rejected', 'cancelled'],
  clp_verified: ['processing', 'rejected'],
  processing: ['paid_out', 'cancelled'],
  paid_out: ['completed'],
  completed: [],
  rejected: ['created'],
  cancelled: [],
};

/**
 * Callable function to update order status
 * Only admins can call this function
 * Enforces status flow validation
 */
export const updateOrderStatus = functions.https.onCall(
  async (data: UpdateOrderStatusData, context) => {
    // Verify authentication
    if (!context.auth) {
      await auditLogger.logSecurityAlert(
        'anonymous',
        'updateOrderStatus',
        'Unauthenticated attempt'
      );
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    // Verify admin claim
    if (!context.auth.token.admin) {
      await auditLogger.logSecurityAlert(
        context.auth.uid,
        'updateOrderStatus',
        'Non-admin user attempted to update order status'
      );
      throw new functions.https.HttpsError('permission-denied', 'Only admins can update order status');
    }

    // Rate limiting
    if (await defaultRateLimiter.checkLimit(context.auth.uid)) {
      await auditLogger.logFailure(
        context.auth.uid,
        'updateOrderStatus',
        'orders',
        'Rate limit exceeded'
      );
      throw new functions.https.HttpsError('resource-exhausted', 'Too many requests');
    }

    const { orderId, newStatus, note } = data;

    if (!orderId || !newStatus) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId and newStatus required');
    }

    try {
      const db = admin.firestore();
      const orderRef = db.collection('orders').doc(orderId);

      // Get order
      const orderDoc = await orderRef.get();
      if (!orderDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Order not found');
      }

      const orderData = orderDoc.data()!;
      const currentStatus = orderData.status as OrderStatus;

      // Validate transition
      const allowedStatuses = STATUS_FLOW[currentStatus] || [];
      if (!allowedStatuses.includes(newStatus as OrderStatus)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Cannot transition from ${currentStatus} to ${newStatus}`
        );
      }

      // Get admin user data
      const adminDoc = await db.collection('users').doc(context.auth.uid).get();
      const adminData = adminDoc.data()!;

      // Update order
      const updateData: any = {
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (newStatus === 'completed') {
        updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      await orderRef.update(updateData);

      // Create event
      await orderRef.collection('events').add({
        fromStatus: currentStatus,
        toStatus: newStatus,
        changedBy: context.auth.uid,
        changedByName: adminData.fullName,
        note: note || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Audit log
      await auditLogger.logSuccess(context.auth.uid, 'updateOrderStatus', 'orders', {
        resourceId: orderId,
        changes: { from: currentStatus, to: newStatus, note },
      });

      return {
        success: true,
        message: `Order status updated to ${newStatus}`,
      };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      
      await auditLogger.logFailure(
        context.auth.uid,
        'updateOrderStatus',
        'orders',
        error.message || 'Failed to update status'
      );
      
      throw new functions.https.HttpsError('internal', error.message || 'Failed to update status');
    }
  }
);
