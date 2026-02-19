/**
 * Notification Service
 * 
 * Este servicio maneja el envío de notificaciones a los clientes.
 * Por ahora es un placeholder - necesitas configurar Firebase Functions
 * o un servicio externo de emails (SendGrid, Resend, etc.)
 * 
 * Ver NOTIFICATIONS_SETUP.md para instrucciones completas.
 */

import { Order } from '../../orders/types/order';

// TODO: Configurar ADMIN_EMAIL desde Firebase Config cuando implementes email notifications
// const ADMIN_EMAIL = 'admin@mandafacil.com';

export const notificationService = {
  /**
   * Envía notificación cuando se confirma la transferencia VES
   * Esto debería ser manejado por Firebase Functions en producción
   */
  notifyTransferCompleted: async (order: Order): Promise<void> => {
    console.log('📧 [NOTIFICATION] Transfer completed for order:', order.orderNumber);
    console.log('📧 Would send email to:', order.customerEmail);
    console.log('📧 With reference:', order.vesTransferReference);
    console.log('📧 Receipt URL:', order.vesReceiptUrl);
    
    // TODO: Implementar con Firebase Functions o servicio externo
    // Ver NOTIFICATIONS_SETUP.md para instrucciones
    
    // Ejemplo con fetch a tu backend o servicio:
    /*
    try {
      await fetch('https://tu-backend.com/api/notifications/transfer-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: order.customerEmail,
          orderNumber: order.orderNumber,
          transferReference: order.vesTransferReference,
          amount: order.amountVesExpected,
          receiptUrl: order.vesReceiptUrl,
          bankDetails: order.vesBankDetails,
        }),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
    */
  },

  /**
   * Envía notificación cuando cambia el estado del pedido
   */
  notifyStatusChange: async (
    order: Order,
    oldStatus: string,
    newStatus: string
  ): Promise<void> => {
    console.log('📧 [NOTIFICATION] Status changed for order:', order.orderNumber);
    console.log('📧 From:', oldStatus, 'To:', newStatus);
    console.log('📧 Customer email:', order.customerEmail);
    
    // TODO: Implementar notificación de cambio de estado
  },

  /**
   * Envía notificación de bienvenida al crear pedido
   */
  notifyOrderCreated: async (order: Order): Promise<void> => {
    console.log('📧 [NOTIFICATION] Order created:', order.orderNumber);
    console.log('📧 Customer email:', order.customerEmail);
    
    // TODO: Implementar email de confirmación de pedido creado
  },

  /**
   * Envía notificación cuando se completa el pedido
   */
  notifyOrderCompleted: async (order: Order): Promise<void> => {
    console.log('📧 [NOTIFICATION] Order completed:', order.orderNumber);
    console.log('📧 Customer email:', order.customerEmail);
    
    // TODO: Implementar email de pedido completado con resumen
  },

  // ========== NOTIFICACIONES AL ADMIN ==========

  /**
   * Notifica al admin cuando un cliente crea un nuevo pedido
   * Esta es la función principal que el admin necesita
   */
  notifyAdminNewOrder: async (order: Order): Promise<void> => {
    console.log('🔔 [ADMIN NOTIFICATION] New order created:', order.orderNumber);
    console.log('🔔 Customer:', order.customerName);
    console.log('🔔 Amount CLP:', order.amountClp);
    console.log('🔔 Amount VES:', order.amountVesExpected);
    
    // TODO: Implementar notificación real
    // Opciones:
    // 1. Email al admin (via Firebase Functions)
    // 2. Telegram Bot (ver ADMIN_NOTIFICATIONS_SETUP.md)
    // 3. WhatsApp Business API
    // 4. SMS (Twilio)
    
    /*
    // Ejemplo con Firebase Functions + Email
    await fetch('https://tu-backend.com/api/notifications/admin/new-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        amountClp: order.amountClp,
        amountVes: order.amountVesExpected,
        orderUrl: `https://tu-app.com/admin/orders/${order.id}`,
      }),
    });
    */
  },

  /**
   * Notifica al admin cuando un cliente sube el comprobante CLP
   */
  notifyAdminReceiptUploaded: async (order: Order): Promise<void> => {
    console.log('🔔 [ADMIN NOTIFICATION] Receipt uploaded for:', order.orderNumber);
    console.log('🔔 Customer:', order.customerName);
    
    // TODO: Implementar notificación
  },

  /**
   * Envía resumen diario al admin (vía Cloud Scheduler)
   */
  sendAdminDailySummary: async (): Promise<void> => {
    console.log('📊 [ADMIN NOTIFICATION] Sending daily summary');
    
    // TODO: Implementar resumen diario
    // - Total de pedidos del día
    // - Pedidos pendientes
    // - Ingresos del día
    // - Pedidos completados
  },
};

/**
 * NOTA IMPORTANTE:
 * 
 * Para que las notificaciones funcionen automáticamente, necesitas:
 * 
 * 1. Configurar Firebase Functions que escuchen cambios en Firestore
 * 2. O crear un servicio backend que maneje los emails
 * 3. Configurar un proveedor de emails (SendGrid, Resend, etc.)
 * 
 * Ver archivos:
 * - NOTIFICATIONS_SETUP.md para notificaciones a clientes
 * - ADMIN_NOTIFICATIONS_SETUP.md para notificaciones al admin
 * 
 * Las funciones aquí son placeholders que logean en consola.
 * Cuando configures Firebase Functions, estas se ejecutarán automáticamente
 * al detectar cambios en los documentos de orders en Firestore.
 * 
 * NOTIFICACIONES AL ADMIN:
 * - Ya está implementado el badge visual en tiempo real en el navbar
 * - Para notificaciones por Telegram/Email, ver ADMIN_NOTIFICATIONS_SETUP.md
 */
