// Script temporal para crear primer admin (SOLO DESARROLLO)
// Ejecutar: npm run dev y visitar /setup-admin

import { doc, setDoc } from 'firebase/firestore';
import { db } from './app/firebase/firebase';

/**
 * INSTRUCCIONES:
 * 
 * 1. Regístrate como usuario normal en /register
 * 2. Copia tu UID de Firebase Console → Authentication → Users
 * 3. Pégalo abajo en REPLACE_WITH_YOUR_UID
 * 4. Ejecuta esta función desde consola del navegador
 * 5. Cierra sesión y vuelve a entrar
 */

export async function makeFirstAdmin() {
  const uid = 'REPLACE_WITH_YOUR_UID'; // 👈 CAMBIA ESTO
  
  if (uid === 'REPLACE_WITH_YOUR_UID') {
    console.error('❌ Debes cambiar el UID en el archivo setupFirstAdmin.ts');
    return;
  }

  try {
    console.log('⏳ Actualizando usuario a admin...');
    
    await setDoc(doc(db, 'users', uid), {
      role: 'admin',
      updatedAt: new Date(),
    }, { merge: true });

    console.log('✅ Usuario actualizado a admin en Firestore');
    console.log('⚠️ IMPORTANTE:');
    console.log('1. Cierra sesión en la app');
    console.log('2. Vuelve a iniciar sesión');
    console.log('3. Serás redirigido a /admin');
    console.log('');
    console.log('Nota: El custom claim se establecerá automáticamente cuando');
    console.log('hagas login la próxima vez (el backend lo detecta por el role).');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('Verifica que el UID sea correcto');
  }
}

// Hacer disponible en window para ejecutar desde consola
if (typeof window !== 'undefined') {
  (window as any).makeFirstAdmin = makeFirstAdmin;
}
