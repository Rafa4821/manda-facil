import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loading } from '../../shared/components'

interface RequireCustomerProps {
  children: React.ReactNode
}

export function RequireCustomer({ children }: RequireCustomerProps) {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Wait for userProfile to load
  if (!userProfile) {
    return <Loading />
  }

  // Only redirect if profile is loaded and role is not customer
  if (userProfile.role !== 'customer') {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
