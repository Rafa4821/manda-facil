// Admin bank account details for CLP transfers
// TODO: Move to Firestore settings collection in production

export interface AdminBankAccount {
  bankName: string;
  accountType: string;
  accountNumber: string;
  rut: string;
  ownerName: string;
  email: string;
}

// ⚠️ IMPORTANTE: Actualiza estos datos con tu información bancaria real
export const ADMIN_BANK_ACCOUNT: AdminBankAccount = {
  bankName: 'Banco Estado',
  accountType: 'Cuenta Vista',
  accountNumber: '12345678-9',
  rut: '12.345.678-9',
  ownerName: 'NOMBRE DEL TITULAR',
  email: 'tu-email@ejemplo.com',
};

// Format for copy-paste (optimized for Chilean banking apps)
export function formatAdminBankDetailsForCopy(): string {
  return `DATOS PARA TRANSFERENCIA CLP

Banco: ${ADMIN_BANK_ACCOUNT.bankName}
Tipo de Cuenta: ${ADMIN_BANK_ACCOUNT.accountType}
Número de Cuenta: ${ADMIN_BANK_ACCOUNT.accountNumber}
RUT: ${ADMIN_BANK_ACCOUNT.rut}
Titular: ${ADMIN_BANK_ACCOUNT.ownerName}
Email: ${ADMIN_BANK_ACCOUNT.email}

⚠️ Importante: Después de transferir, sube tu comprobante en este formulario.`;
}
