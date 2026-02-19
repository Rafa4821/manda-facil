import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../app/firebase/firebase';

/**
 * Hook para escuchar pedidos pendientes en tiempo real
 * Útil para mostrar notificaciones al admin
 */
export function usePendingOrders() {
  const [pendingCount, setPendingCount] = useState(0);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query para pedidos pendientes (creados o con comprobante subido)
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('status', 'in', ['created', 'clp_receipt_uploaded'])
    );

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
      
      // Detectar nuevos pedidos (para notificación visual/sonora)
      const currentIds = new Set<string>();
      snapshot.forEach(doc => {
        currentIds.add(doc.id);
      });
      
      // Si hay más pedidos que antes, marcar como nuevos
      if (currentIds.size > newOrderIds.size && !loading) {
        // Encontrar IDs nuevos
        const newIds = Array.from(currentIds).filter(id => !newOrderIds.has(id));
        if (newIds.length > 0) {
          // Reproducir sonido o mostrar notificación
          playNotificationSound();
          showBrowserNotification(newIds.length);
        }
      }
      
      setNewOrderIds(currentIds);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [newOrderIds, loading]);

  return { pendingCount, loading };
}

/**
 * Reproduce un sonido de notificación
 */
function playNotificationSound() {
  try {
    // Crear un beep simple con Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frecuencia del beep
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

/**
 * Muestra notificación del navegador (requiere permiso)
 */
function showBrowserNotification(count: number) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🔔 Nuevo Pedido en MandaFácil', {
      body: `${count} ${count === 1 ? 'nuevo pedido' : 'nuevos pedidos'} pendiente${count === 1 ? '' : 's'}`,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'new-order',
      requireInteraction: true,
    });
  }
}

/**
 * Solicita permiso para notificaciones del navegador
 */
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }
}
