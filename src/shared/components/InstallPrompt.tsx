import { useState, useEffect } from 'react';
import { Alert, Button } from 'react-bootstrap';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isInstalled) {
        setShowInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User ${outcome} the install prompt`);
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <Alert variant="success" dismissible onClose={handleDismiss} className="mb-3">
      <Alert.Heading>📱 Instalar Aplicación</Alert.Heading>
      <p>
        Instala Manda Fácil en tu dispositivo para acceder más rápido y recibir
        notificaciones instantáneas.
      </p>
      <div className="d-grid">
        <Button variant="success" onClick={handleInstall}>
          Instalar Ahora
        </Button>
      </div>
    </Alert>
  );
}
