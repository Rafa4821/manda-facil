import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../app/firebase/firebase'

export interface UploadResult {
  url: string
  path: string
  uploadedAt: Date
}

export const storageService = {
  // Upload CLP receipt for customer
  uploadClpReceipt: async (
    userId: string,
    orderId: string,
    file: File
  ): Promise<UploadResult> => {
    try {
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `receipts/clp/${userId}/${orderId}/${fileName}`
      const storageRef = ref(storage, filePath)
      
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      
      return {
        url,
        path: filePath,
        uploadedAt: new Date(),
      }
    } catch (error) {
      console.error('Error uploading CLP receipt:', error)
      throw error
    }
  },

  // Upload VES receipt for admin
  uploadVesReceipt: async (
    orderId: string,
    file: File
  ): Promise<UploadResult> => {
    try {
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `receipts/ves/${orderId}/${fileName}`
      const storageRef = ref(storage, filePath)
      
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      
      return {
        url,
        path: filePath,
        uploadedAt: new Date(),
      }
    } catch (error) {
      console.error('Error uploading VES receipt:', error)
      throw error
    }
  },

  // Delete receipt (if needed)
  deleteReceipt: async (filePath: string): Promise<void> => {
    try {
      const storageRef = ref(storage, filePath)
      await deleteObject(storageRef)
    } catch (error) {
      console.error('Error deleting receipt:', error)
      throw error
    }
  },

  // Validate file
  validateReceiptFile: (file: File): { valid: boolean; error?: string } => {
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato no válido. Solo se permiten archivos JPG, PNG o PDF',
      }
    }
    
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `El archivo es muy grande. Máximo permitido: ${MAX_SIZE / 1024 / 1024}MB`,
      }
    }
    
    return { valid: true }
  },
}
