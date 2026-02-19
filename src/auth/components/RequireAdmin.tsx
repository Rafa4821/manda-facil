import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loading } from '../../shared/components'

interface RequireAdminProps {
  children: React.ReactNode
}

export function RequireAdmin({ children }: RequireAdminProps) {
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

  // Only redirect if profile is loaded and role is not admin
  if (userProfile.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
