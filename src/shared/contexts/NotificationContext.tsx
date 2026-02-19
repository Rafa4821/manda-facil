import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useAuth } from '../../auth/context/AuthContext';
import { fcmService } from '../services/fcmService';

interface NotificationContextType {
  requestPermission: () => Promise<void>;
  permissionStatus: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

interface ToastNotification {
  id: string;
  title: string;
  body: string;
  orderId?: string;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    fcmService.getPermissionStatus()
  );
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((title: string, body: string, orderId?: string) => {
    const notification: ToastNotification = {
      id: Date.now().toString(),
      title,
      body,
      orderId,
    };

    setToasts((prev) => [...prev, notification]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeToast(notification.id);
    }, 5000);
  }, [removeToast]);

  const requestPermission = useCallback(async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    if (!fcmService.isSupported()) {
      alert('Las notificaciones no están soportadas en este navegador');
      return;
    }

    const token = await fcmService.requestPermission(user.uid);
    
    if (token) {
      setPermissionStatus('granted');
    } else {
      setPermissionStatus(Notification.permission);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !fcmService.isSupported()) return;

    // Setup foreground message listener
    const unsubscribe = fcmService.setupForegroundListener((payload) => {
      const notification: ToastNotification = {
        id: Date.now().toString(),
        title: payload.notification?.title || 'Notificación',
        body: payload.notification?.body || '',
        orderId: payload.data?.orderId,
      };
      
      showToast(notification.title, notification.body, notification.orderId);
    });

    return () => unsubscribe();
  }, [user, showToast]);

  return (
    <NotificationContext.Provider value={{ requestPermission, permissionStatus }}>
      {children}
      
      {/* Toast notifications container */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            show={true}
            autohide
            delay={5000}
          >
            <Toast.Header>
              <strong className="me-auto">{toast.title}</strong>
              <small>ahora</small>
            </Toast.Header>
            <Toast.Body>{toast.body}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </NotificationContext.Provider>
  );
}
