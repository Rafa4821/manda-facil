import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/context/AuthContext'
import { initAppCheck } from './app/firebase/appCheck'

// Initialize App Check for security
initAppCheck()

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

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
