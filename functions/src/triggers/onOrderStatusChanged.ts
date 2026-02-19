import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const STATUS_MESSAGES: Record<string, string> = {
  created: 'Tu pedido ha sido creado',
  clp_receipt_uploaded: 'Comprobante CLP recibido',
  clp_verified: 'Pago CLP verificado',
  processing: 'Tu pedido está siendo procesado',
  paid_out: 'Pago VES realizado',
  completed: '¡Tu pedido está completo!',
  rejected: 'Tu pedido ha sido rechazado',
  cancelled: 'Tu pedido ha sido cancelado',
};

/**
 * Firestore trigger when order status changes
 * Sends FCM push notification to customer
 */
export const onOrderStatusChanged = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const orderId = context.params.orderId;

    // Check if status changed
    if (beforeData.status === afterData.status) {
      console.log('Status unchanged, skipping notification');
      return null;
    }

    const customerId = afterData.customerId;
    const newStatus = afterData.status;
    const orderNumber = afterData.orderNumber;

    console.log(`Order ${orderId} status changed: ${beforeData.status} -> ${newStatus}`);

    try {
      // Get customer's FCM tokens
      const tokensSnapshot = await admin
        .firestore()
        .collection('users')
        .doc(customerId)
        .collection('fcmTokens')
        .get();

      if (tokensSnapshot.empty) {
        console.log('No FCM tokens found for user:', customerId);
        return null;
      }

      const tokens: string[] = [];
      tokensSnapshot.forEach((doc) => {
        tokens.push(doc.data().token);
      });

      // Prepare notification
      const message = STATUS_MESSAGES[newStatus] || 'Estado de pedido actualizado';
      const payload = {
        notification: {
          title: `Pedido #${orderNumber}`,
          body: message,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: `order-${orderId}`,
        },
        data: {
          orderId,
          orderNumber,
          status: newStatus,
          click_action: `/app/orders/${orderId}`,
        },
      };

      // Send to all tokens
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: payload.notification,
        data: payload.data,
        webpush: {
          fcmOptions: {
            link: `${process.env.APP_URL || 'http://localhost:5173'}/app/orders/${orderId}`,
          },
        },
      });

      console.log(`Successfully sent notification to ${response.successCount} devices`);

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const batch = admin.firestore().batch();
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
            const tokenDoc = tokensSnapshot.docs[idx];
            batch.delete(tokenDoc.ref);
          }
        });
        await batch.commit();
        console.log(`Cleaned up ${response.failureCount} invalid tokens`);
      }

      return null;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });
