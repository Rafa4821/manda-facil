import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../app/firebase/firebase';
import { SavedBankAccount, CreateSavedBankAccountData, convertTimestampToDate } from '../types/savedBankAccount';

export const savedBankAccountService = {
  /**
   * Obtiene todas las cuentas guardadas de un usuario
   */
  getUserSavedAccounts: async (userId: string): Promise<SavedBankAccount[]> => {
    try {
      const accountsRef = collection(db, 'users', userId, 'savedBankAccounts');
      const q = query(accountsRef, orderBy('lastUsed', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId,
          alias: data.alias,
          beneficiaryName: data.beneficiaryName,
          beneficiaryId: data.beneficiaryId,
          bank: data.bank,
          accountType: data.accountType,
          accountNumber: data.accountNumber,
          phone: data.phone,
          email: data.email,
          createdAt: convertTimestampToDate(data.createdAt),
          lastUsed: data.lastUsed ? convertTimestampToDate(data.lastUsed) : undefined,
          useCount: data.useCount || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching saved accounts:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva cuenta guardada
   */
  createSavedAccount: async (
    userId: string,
    accountData: CreateSavedBankAccountData
  ): Promise<string> => {
    try {
      const accountsRef = collection(db, 'users', userId, 'savedBankAccounts');
      const docRef = await addDoc(accountsRef, {
        ...accountData,
        createdAt: Timestamp.now(),
        useCount: 0,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating saved account:', error);
      throw error;
    }
  },

  /**
   * Actualiza una cuenta guardada
   */
  updateSavedAccount: async (
    userId: string,
    accountId: string,
    accountData: Partial<CreateSavedBankAccountData>
  ): Promise<void> => {
    try {
      const accountRef = doc(db, 'users', userId, 'savedBankAccounts', accountId);
      await updateDoc(accountRef, accountData);
    } catch (error) {
      console.error('Error updating saved account:', error);
      throw error;
    }
  },

  /**
   * Elimina una cuenta guardada
   */
  deleteSavedAccount: async (userId: string, accountId: string): Promise<void> => {
    try {
      const accountRef = doc(db, 'users', userId, 'savedBankAccounts', accountId);
      await deleteDoc(accountRef);
    } catch (error) {
      console.error('Error deleting saved account:', error);
      throw error;
    }
  },

  /**
   * Marca una cuenta como usada (actualiza lastUsed y useCount)
   */
  markAccountAsUsed: async (userId: string, accountId: string): Promise<void> => {
    try {
      const accountRef = doc(db, 'users', userId, 'savedBankAccounts', accountId);
      const accountDoc = await getDoc(accountRef);
      
      if (accountDoc.exists()) {
        const currentCount = accountDoc.data().useCount || 0;
        await updateDoc(accountRef, {
          lastUsed: Timestamp.now(),
          useCount: currentCount + 1,
        });
      }
    } catch (error) {
      console.error('Error marking account as used:', error);
      // No lanzar error para que no bloquee la creación del pedido
    }
  },

  /**
   * Busca si existe una cuenta similar (para evitar duplicados)
   */
  findSimilarAccount: async (
    userId: string,
    accountNumber: string
  ): Promise<SavedBankAccount | null> => {
    try {
      const accountsRef = collection(db, 'users', userId, 'savedBankAccounts');
      const q = query(accountsRef, where('accountNumber', '==', accountNumber));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        userId,
        alias: data.alias,
        beneficiaryName: data.beneficiaryName,
        beneficiaryId: data.beneficiaryId,
        bank: data.bank,
        accountType: data.accountType,
        accountNumber: data.accountNumber,
        phone: data.phone,
        email: data.email,
        createdAt: convertTimestampToDate(data.createdAt),
        lastUsed: data.lastUsed ? convertTimestampToDate(data.lastUsed) : undefined,
        useCount: data.useCount || 0,
      };
    } catch (error) {
      console.error('Error finding similar account:', error);
      return null;
    }
  },
};
