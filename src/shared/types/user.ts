export interface UserProfile {
  uid: string
  email: string
  fullName: string
  phone?: string
  role: 'customer' | 'admin'
  createdAt: Date
}
