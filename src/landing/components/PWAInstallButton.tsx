import { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (isInstalled) {
    return (
      <Alert variant="success" className="mb-0 d-inline-flex align-items-center">
        <span className="me-2">✓</span>
        <span>App instalada</span>
      </Alert>
    );
  }

  if (!showInstallButton) {
    return null;
  }

  return (
    <div className="pwa-install-section">
      <Button
        variant="success"
        size="lg"
        className="px-5 py-3 fw-bold d-flex align-items-center gap-2"
        onClick={handleInstallClick}
      >
        <span className="install-icon">📱</span>
        <span>Instalar App</span>
      </Button>
      <small className="text-white-50 d-block mt-2">
        Instala la app en tu dispositivo para acceso rápido
      </small>
    </div>
  );
}
