import { Alert, Button } from 'react-bootstrap';
import { useNotifications } from '../contexts/NotificationContext';
import { fcmService } from '../services/fcmService';

export function NotificationBanner() {
  const { requestPermission, permissionStatus } = useNotifications();

  if (!fcmService.isSupported()) {
    return null;
  }

  if (permissionStatus === 'granted') {
    return null;
  }

  if (permissionStatus === 'denied') {
    return (
      <Alert variant="warning" className="mb-3">
        <Alert.Heading>Notificaciones Bloqueadas</Alert.Heading>
        <p className="mb-0">
          Has bloqueado las notificaciones. Para recibir actualizaciones de tus pedidos,
          habilita las notificaciones en la configuración de tu navegador.
        </p>
      </Alert>
    );
  }

  return (
    <Alert variant="info" className="mb-3" dismissible>
      <Alert.Heading>🔔 Recibe Notificaciones</Alert.Heading>
      <p>
        Mantente informado sobre el estado de tus pedidos. Activa las notificaciones
        para recibir actualizaciones en tiempo real.
      </p>
      <div className="d-grid">
        <Button variant="primary" onClick={requestPermission}>
          Activar Notificaciones
        </Button>
      </div>
    </Alert>
  );
}
