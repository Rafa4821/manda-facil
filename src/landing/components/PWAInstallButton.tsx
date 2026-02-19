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
  const [isInstalling, setIsInstalling] = useState(false);

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
      console.log('✅ App installed successfully');
      setIsInstalling(false);
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

    try {
      setIsInstalling(true);
      await deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        // Wait a bit for the appinstalled event
        setTimeout(() => {
          // If appinstalled event didn't fire, mark as installed anyway
          if (!isInstalled) {
            setIsInstalled(true);
            setIsInstalling(false);
          }
        }, 3000);
      } else {
        console.log('❌ User dismissed the install prompt');
        setIsInstalling(false);
        setShowInstallButton(true);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
      setIsInstalling(false);
      setShowInstallButton(true);
    }
  };

  if (isInstalling) {
    return (
      <Alert variant="info" className="mb-0 d-inline-flex align-items-center">
        <div className="spinner-border spinner-border-sm me-2" role="status">
          <span className="visually-hidden">Instalando...</span>
        </div>
        <span>Instalando MandaFácil...</span>
      </Alert>
    );
  }

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
