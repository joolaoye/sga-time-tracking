"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { AuthService } from "@/lib/auth"
import type { UserRole } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermissions?: string[]
  requiredFeatures?: string[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermissions = [],
  requiredFeatures = [],
  fallback,
  redirectTo = "/unauthorized"
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
        return
      }

      // Check role-based access
      if (requiredRole && !AuthService.hasPermission(user.role, requiredRole)) {
        router.push(redirectTo)
        return
      }

      // Check specific permissions
      if (requiredPermissions.length > 0 && !AuthService.hasAllPermissions(user.role, requiredPermissions)) {
        router.push(redirectTo)
        return
      }

      // Check feature access
      if (requiredFeatures.length > 0 && !requiredFeatures.every(feature => AuthService.canAccessFeature(user.role, feature))) {
        router.push(redirectTo)
        return
      }
    }
  }, [user, loading, requiredRole, requiredPermissions, requiredFeatures, redirectTo, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check all access conditions
  const hasRoleAccess = !requiredRole || AuthService.hasPermission(user.role, requiredRole)
  const hasPermissionAccess = requiredPermissions.length === 0 || AuthService.hasAllPermissions(user.role, requiredPermissions)
  const hasFeatureAccess = requiredFeatures.length === 0 || requiredFeatures.every(feature => AuthService.canAccessFeature(user.role, feature))

  if (!hasRoleAccess || !hasPermissionAccess || !hasFeatureAccess) {
    return fallback || null
  }

  return <>{children}</>
}

// Convenience components for common protection patterns
export function AdminOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

export function ChairOrAdmin({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="chair" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

export function TeamAccess({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredFeatures={['team']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

export function UserManagement({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredPermissions={[AuthService.PERMISSIONS.ADMIN.MANAGE_USERS]} fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

export function TimeTracking({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredPermissions={[AuthService.PERMISSIONS.TIME_TRACKING.VIEW_OWN_LOGS]} fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}
