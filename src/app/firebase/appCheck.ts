import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { app } from './firebase';

// reCAPTCHA v3 site key - get from Firebase Console
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

export function initAppCheck() {
  // Only initialize in production
  if (import.meta.env.PROD && RECAPTCHA_SITE_KEY) {
    try {
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      console.log('App Check initialized');
      return appCheck;
    } catch (error) {
      console.error('App Check initialization failed:', error);
    }
  } else {
    console.log('App Check skipped (development mode)');
  }
}
