import { Timestamp } from 'firebase/firestore';

export interface SavedBankAccount {
  id: string;
  userId: string;
  alias: string; // Nombre para identificar la cuenta (ej: "Mi cuenta principal", "Cuenta de mamá")
  beneficiaryName: string;
  beneficiaryId: string; // Cédula o RIF
  bank: string;
  accountType: 'corriente' | 'ahorro';
  accountNumber: string;
  phone: string;
  email?: string;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number; // Contador de veces usada
}

export interface CreateSavedBankAccountData {
  alias: string;
  beneficiaryName: string;
  beneficiaryId: string;
  bank: string;
  accountType: 'corriente' | 'ahorro';
  accountNumber: string;
  phone: string;
  email?: string;
}

// Helper para convertir de Firestore
export const convertTimestampToDate = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};
