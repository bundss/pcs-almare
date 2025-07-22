"use client"

import type { ReactNode } from "react"
import { usePermissions } from "@/hooks/use-permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldX } from "lucide-react"

interface PermissionGuardProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  resource?: string
  action?: string
  requireAll?: boolean
  fallback?: ReactNode
}

// Helper function for checking all permissions
function checkAllPermissions(permissions: string[], hasPermission: (permission: string) => boolean): boolean {
  return permissions.every((permission) => hasPermission(permission))
}

export default function PermissionGuard({
  children,
  permission,
  permissions,
  resource,
  action,
  requireAll = false,
  fallback,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, loading } = usePermissions()

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
  }

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll ? checkAllPermissions(permissions, hasPermission) : hasAnyPermission(permissions)
  } else if (resource && action) {
    hasAccess = hasPermission(`${resource}.${action}`)
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>Você não tem permissão para acessar este recurso.</AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}
