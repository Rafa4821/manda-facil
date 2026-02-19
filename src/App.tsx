import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth/context/AuthContext'
import { NotificationProvider } from './shared/contexts/NotificationContext'
import { router } from './app/router'
import './App.css'
import './shared/styles/responsive.css'
import './shared/styles/mobile-tables.css'
import './shared/styles/mobile-enhancements.css'

function App() {
  useEffect(() => {
    // Register service worker for PWA (disabled in development)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
