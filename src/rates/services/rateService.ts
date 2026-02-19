import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../app/firebase/firebase'
import { Rate } from '../types/rate'

const CURRENT_RATE_DOC = 'current'

export const rateService = {
  getCurrentRate: async (): Promise<Rate | null> => {
    try {
      const rateRef = doc(db, 'rates', CURRENT_RATE_DOC)
      const rateSnap = await getDoc(rateRef)
      
      if (!rateSnap.exists()) {
        return null
      }

      const data = rateSnap.data()
      return {
        clpToVes: data.clpToVes,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        updatedBy: data.updatedBy,
      }
    } catch (error) {
      console.error('Error fetching current rate:', error)
      throw error
    }
  },

  updateRate: async (clpToVes: number, userId: string): Promise<void> => {
    try {
      const rateRef = doc(db, 'rates', CURRENT_RATE_DOC)
      await setDoc(rateRef, {
        clpToVes,
        updatedAt: new Date(),
        updatedBy: userId,
      })
    } catch (error) {
      console.error('Error updating rate:', error)
      throw error
    }
  },
}
