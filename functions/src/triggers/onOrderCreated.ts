import * as functions from 'firebase-functions';

/**
 * Firestore trigger when order is created
 * Can be used for notifications, logging, etc.
 */
export const onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snapshot, context) => {
    const orderData = snapshot.data();
    const orderId = context.params.orderId;

    console.log(`Order created: ${orderId}`, {
      orderNumber: orderData.orderNumber,
      customerId: orderData.customerId,
      amountClp: orderData.amountClp,
    });

    // TODO: Send notification to admin
    // TODO: Send confirmation email to customer

    return null;
  });
