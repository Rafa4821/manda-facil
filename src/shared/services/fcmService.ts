import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../app/firebase/firebase';

// FCM VAPID key - Get from Firebase Console
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';

export const fcmService = {
  // Request notification permission and get FCM token
  requestPermission: async (userId: string): Promise<string | null> => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Get FCM token
      const messaging = getMessaging();
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (token) {
        // Save token to Firestore
        await fcmService.saveToken(userId, token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  // Save FCM token to Firestore
  saveToken: async (userId: string, token: string): Promise<void> => {
    try {
      await setDoc(
        doc(collection(db, 'users', userId, 'fcmTokens'), token),
        {
          token,
          createdAt: new Date(),
          userAgent: navigator.userAgent,
        }
      );
      console.log('FCM token saved successfully');
    } catch (error) {
      console.error('Error saving FCM token:', error);
      throw error;
    }
  },

  // Remove FCM token from Firestore
  removeToken: async (userId: string, token: string): Promise<void> => {
    try {
      await deleteDoc(doc(collection(db, 'users', userId, 'fcmTokens'), token));
      console.log('FCM token removed successfully');
    } catch (error) {
      console.error('Error removing FCM token:', error);
      throw error;
    }
  },

  // Setup foreground message listener
  setupForegroundListener: (
    onNotification: (payload: any) => void
  ): (() => void) => {
    try {
      const messaging = getMessaging();
      
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        onNotification(payload);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up foreground listener:', error);
      return () => {};
    }
  },

  // Check if notifications are supported
  isSupported: (): boolean => {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  // Get current permission status
  getPermissionStatus: (): NotificationPermission => {
    return Notification.permission;
  },
};
