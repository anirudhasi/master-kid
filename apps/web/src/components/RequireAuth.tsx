import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  requireProfile?: boolean
}

export default function RequireAuth({ children, requireProfile = false }: Props) {
  const { isAuthenticated, step, activeKidId } = useAuthStore()
  const loc = useLocation()

  if (!isAuthenticated || step !== 'profiles') {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  }

  if (requireProfile && activeKidId === null) {
    // Admin can access everything without a kid selected
    // So requireProfile only matters for kid-specific routes if we choose
    // For now, admin and kid both go through
  }

  return <>{children}</>
}
