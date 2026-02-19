# Deployment Guide

## Pre-requisitos

### Firebase
- Proyecto Firebase configurado
- Firestore habilitado
- Storage habilitado
- Authentication habilitado (Email/Password)
- App Check configurado con reCAPTCHA v3

### Vercel
- Cuenta de Vercel conectada a GitHub

## Pasos de Deployment

### 1. Preparar Firebase

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

### 2. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, agregar:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_RECAPTCHA_SITE_KEY=
```

### 3. Push a GitHub

```bash
git add .
git commit -m "Production ready"
git push origin main
```

El workflow de GitHub Actions verificará automáticamente ESLint antes de permitir el merge.

### 4. Deploy en Vercel

Vercel detectará automáticamente el push y desplegará la aplicación.

## Verificación Post-Deploy

- [ ] Landing page carga correctamente
- [ ] Login/Register funciona
- [ ] Firebase conectado
- [ ] PWA instalable
- [ ] Headers de seguridad activos
- [ ] Mobile responsive funcionando

## Rollback

Si algo falla:
```bash
# En Vercel dashboard: Deployments → Rollback to previous
```

## Configuración del Admin

Después del primer deploy, crear usuario admin manualmente en Firebase Console:
1. Authentication → Users → Crear usuario
2. Firestore → users → [uid] → Agregar campo `role: "admin"`
3. Rates → Crear documento inicial con tasa de cambio
