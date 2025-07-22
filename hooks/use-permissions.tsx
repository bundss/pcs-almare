"use client"

import { useState, useEffect, useContext, createContext, createElement } from "react"
import type { ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PermissionContextType {
  userProfile: any
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  canCreate: (resource: string) => boolean
  canRead: (resource: string) => boolean
  canUpdate: (resource: string) => boolean
  canDelete: (resource: string) => boolean
  isAdmin: () => boolean
  loading: boolean
  refreshPermissions: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const loadPermissions = async () => {
    try {
      const result = await supabase.auth.getUser()
      if (result.data.user) {
        setUserProfile({ id: result.data.user.id, email: result.data.user.email })
      }
    } catch (error) {
      console.error("Error loading permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [])

  const refreshPermissions = async () => {
    setLoading(true)
    await loadPermissions()
  }

  const contextValue: PermissionContextType = {
    userProfile,
    hasPermission: () => true,
    hasAnyPermission: () => true,
    canCreate: () => true,
    canRead: () => true,
    canUpdate: () => true,
    canDelete: () => true,
    isAdmin: () => true,
    loading,
    refreshPermissions,
  }

  // Usando createElement para evitar problemas de parsing JSX
  return createElement(PermissionContext.Provider, { value: contextValue }, children)
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider")
  }
  return context
}
