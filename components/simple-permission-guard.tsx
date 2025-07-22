"use client"

import type { ReactNode } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldX } from "lucide-react"

interface SimplePermissionGuardProps {
  children: ReactNode
  show?: boolean
  fallback?: ReactNode
}

export default function SimplePermissionGuard({ children, show = true, fallback }: SimplePermissionGuardProps) {
  if (!show) {
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
