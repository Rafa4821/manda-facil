import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth'
import { auth } from '../../app/firebase/firebase'
import { userService } from '../../shared/services/userService'

export const authService = {
  register: async (email: string, password: string, fullName: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, {
      displayName: fullName,
    })
    
    await userService.createUserProfile(
      userCredential.user.uid,
      email,
      fullName,
      'customer'
    )
    
    return userCredential.user
  },

  login: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  },

  logout: async (): Promise<void> => {
    await signOut(auth)
  },

  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email)
  },
}
