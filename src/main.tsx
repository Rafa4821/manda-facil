import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/context/AuthContext'
import { initAppCheck } from './app/firebase/appCheck'
import { registerSW } from 'virtual:pwa-register'

// Initialize App Check for security
initAppCheck()

// Register Service Worker for PWA (vite-plugin-pwa)
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nueva versión disponible. ¿Actualizar ahora?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('✅ App lista para funcionar offline')
  },
  onRegistered(registration: ServiceWorkerRegistration | undefined) {
    console.log('✅ Service Worker registrado:', registration?.scope)
  },
  onRegisterError(error: Error) {
    console.error('❌ Error registrando Service Worker:', error)
  }
})

// Setup script for development (remove in production)
if (import.meta.env.DEV) {
  import('./setupFirstAdmin').then(module => {
    (window as any).makeFirstAdmin = module.makeFirstAdmin;
    console.log('💡 Dev Helper: Para hacerte admin, ejecuta: makeFirstAdmin()');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
