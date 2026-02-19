import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  setDoc,
  deleteDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../../app/firebase/firebase'
import { Order, CreateOrderData } from '../types/order'
import { rateService } from '../../rates/services/rateService'

// Helper to safely convert Firestore Timestamp to Date
const toDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (value?.toDate && typeof value.toDate === 'function') return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  return undefined;
}

// Helper to delete image from Firebase Storage
const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    if (!imageUrl) return;
    
    // Extract path from Firebase Storage URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
    const urlMatch = imageUrl.match(/\/o\/(.+?)\?/);
    if (urlMatch && urlMatch[1]) {
      const imagePath = decodeURIComponent(urlMatch[1]);
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      console.log('✅ Deleted image:', imagePath);
    }
  } catch (error: any) {
    // Ignore if file doesn't exist
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting image:', error);
    }
  }
}

export const orderService = {
  createOrder: async (
    customerId: string,
    customerName: string,
    customerEmail: string,
    orderData: CreateOrderData
  ): Promise<string> => {
    try {
      // Get current rate
      const currentRate = await rateService.getCurrentRate()
      if (!currentRate) {
        throw new Error('No hay tasa de cambio configurada')
      }

      // Calculate expected VES amount
      const amountVesExpected = orderData.amountClp * currentRate.clpToVes

      // Generate order number (timestamp-based for now)
      const orderNumber = `ORD-${Date.now()}`

      // Set initial status based on whether receipt is uploaded
      const initialStatus = orderData.clpReceiptUrl ? 'clp_receipt_uploaded' : 'created';
      
      const orderRef = await addDoc(collection(db, 'orders'), {
        orderNumber,
        customerId,
        customerName,
        customerEmail,
        amountClp: orderData.amountClp,
        rateSnapshot: currentRate.clpToVes,
        amountVesExpected,
        status: initialStatus,
        vesBankDetails: orderData.vesBankDetails,
        clpReceiptUrl: orderData.clpReceiptUrl,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      return orderRef.id
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  },

  getCustomerOrders: async (customerId: string): Promise<Order[]> => {
    try {
      const ordersRef = collection(db, 'orders')
      const q = query(
        ordersRef,
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          amountClp: data.amountClp,
          rateSnapshot: data.rateSnapshot,
          amountVesExpected: data.amountVesExpected,
          status: data.status,
          clpReceiptUrl: data.clpReceiptUrl,
          vesReceiptUrl: data.vesReceiptUrl,
          vesBankDetails: data.vesBankDetails,
          vesTransferReference: data.vesTransferReference,
          vesTransferredAt: toDate(data.vesTransferredAt),
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
          completedAt: toDate(data.completedAt),
        }
      })
    } catch (error) {
      console.error('Error fetching customer orders:', error)
      throw error
    }
  },

  getOrderById: async (orderId: string): Promise<Order | null> => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      const orderSnap = await getDoc(orderRef)
      
      if (!orderSnap.exists()) {
        return null
      }

      const data = orderSnap.data()
      return {
        id: orderSnap.id,
        orderNumber: data.orderNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        amountClp: data.amountClp,
        rateSnapshot: data.rateSnapshot,
        amountVesExpected: data.amountVesExpected,
        status: data.status,
        clpReceiptUrl: data.clpReceiptUrl,
        vesReceiptUrl: data.vesReceiptUrl,
        vesBankDetails: data.vesBankDetails,
        vesTransferReference: data.vesTransferReference,
        vesTransferredAt: toDate(data.vesTransferredAt),
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
        completedAt: toDate(data.completedAt),
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      throw error
    }
  },

  // Update order with CLP receipt
  updateOrderWithClpReceipt: async (
    orderId: string,
    receiptUrl: string
  ): Promise<void> => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await setDoc(orderRef, {
        clpReceiptUrl: receiptUrl,
        status: 'clp_receipt_uploaded',
        updatedAt: Timestamp.now(),
      }, { merge: true })
    } catch (error) {
      console.error('Error updating order with receipt:', error)
      throw error
    }
  },

  // Update order with VES receipt
  updateOrderWithVesReceipt: async (
    orderId: string,
    receiptUrl: string
  ): Promise<void> => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await setDoc(orderRef, {
        vesReceiptUrl: receiptUrl,
        updatedAt: Timestamp.now(),
      }, { merge: true })
    } catch (error) {
      console.error('Error updating order with VES receipt:', error)
      throw error
    }
  },

  // Update order status
  updateOrderStatus: async (
    orderId: string,
    newStatus: string,
    completedAt?: Date
  ): Promise<void> => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      const updateData: any = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      }
      
      if (completedAt) {
        updateData.completedAt = Timestamp.fromDate(completedAt)
      }
      
      await setDoc(orderRef, updateData, { merge: true })
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  },

  // Mark VES transfer as completed
  markVesTransferred: async (
    orderId: string,
    transferReference: string
  ): Promise<void> => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await setDoc(orderRef, {
        vesTransferReference: transferReference,
        vesTransferredAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true })
    } catch (error) {
      console.error('Error marking VES as transferred:', error)
      throw error
    }
  },

  // Admin: Get all orders with optional status filter
  getAllOrders: async (statusFilter?: string): Promise<Order[]> => {
    try {
      const ordersRef = collection(db, 'orders')
      let q = query(ordersRef, orderBy('createdAt', 'desc'))
      
      if (statusFilter && statusFilter !== 'all') {
        q = query(ordersRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
      }
      
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          amountClp: data.amountClp,
          rateSnapshot: data.rateSnapshot,
          amountVesExpected: data.amountVesExpected,
          status: data.status,
          clpReceiptUrl: data.clpReceiptUrl,
          vesReceiptUrl: data.vesReceiptUrl,
          vesBankDetails: data.vesBankDetails,
          vesTransferReference: data.vesTransferReference,
          vesTransferredAt: toDate(data.vesTransferredAt),
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
          completedAt: toDate(data.completedAt),
        }
      })
    } catch (error) {
      console.error('Error fetching all orders:', error)
      throw error
    }
  },

  // Delete order and all associated images
  deleteOrder: async (orderId: string): Promise<void> => {
    try {
      // First, get the order to retrieve image URLs
      const order = await orderService.getOrderById(orderId);
      if (!order) {
        throw new Error('Pedido no encontrado');
      }

      // Delete images from Storage
      if (order.clpReceiptUrl) {
        await deleteImageFromStorage(order.clpReceiptUrl);
      }
      if (order.vesReceiptUrl) {
        await deleteImageFromStorage(order.vesReceiptUrl);
      }

      // Delete order document
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
      
      console.log('✅ Deleted order:', orderId);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  // Bulk delete orders
  bulkDeleteOrders: async (orderIds: string[]): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const orderId of orderIds) {
      try {
        await orderService.deleteOrder(orderId);
        success++;
      } catch (error) {
        console.error(`Failed to delete order ${orderId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  },

  // Bulk update order status
  bulkUpdateStatus: async (orderIds: string[], newStatus: string): Promise<{ success: number; failed: number }> => {
    const batch = writeBatch(db);
    let success = 0;
    let failed = 0;

    try {
      for (const orderId of orderIds) {
        const orderRef = doc(db, 'orders', orderId);
        batch.update(orderRef, {
          status: newStatus,
          updatedAt: Timestamp.now(),
        });
      }

      await batch.commit();
      success = orderIds.length;
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      failed = orderIds.length;
      throw error;
    }

    return { success, failed };
  },
}
