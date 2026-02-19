import * as admin from 'firebase-admin';

admin.initializeApp();

// Export all functions
export { setAdminClaim } from './auth/setAdminClaim';
export { createOrder } from './orders/createOrder';
export { updateOrderStatus } from './orders/updateOrderStatus';
export { updateRate } from './rates/updateRate';
export { attachVesReceipt } from './orders/attachVesReceipt';
export { onOrderCreated } from './triggers/onOrderCreated';
export { onOrderStatusChanged } from './triggers/onOrderStatusChanged';
