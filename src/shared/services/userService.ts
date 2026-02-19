import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../../app/firebase/firebase'
import { UserProfile } from '../types/user'

export const userService = {
  createUserProfile: async (
    uid: string,
    email: string,
    fullName: string,
    role: 'customer' | 'admin' = 'customer'
  ): Promise<void> => {
    const userRef = doc(db, 'users', uid)
    const userData: Omit<UserProfile, 'uid'> = {
      email,
      fullName,
      role,
      createdAt: new Date(),
    }
    await setDoc(userRef, userData)
  },

  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return null
    }

    const data = userSnap.data()
    return {
      uid,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      createdAt: data.createdAt?.toDate() || new Date(),
    }
  },
}
