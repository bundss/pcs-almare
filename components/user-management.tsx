"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, Plus, Shield, UserCheck, UserX } from "lucide-react"
import { permissionManager, type UserProfile, type Role } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import PermissionGuard from "./permission-guard"

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "", roleId: "" })
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClientComponentClient()
  const { isAdmin } = usePermissions()

  useEffect(() => {
    if (isAdmin()) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        permissionManager.getAllUsers(),
        permissionManager.getAllRoles(),
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.roleId) return

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
      })

      if (authError) throw authError

      // Create user profile
      await permissionManager.createUserProfile(authData.user.id, newUser.email, newUser.roleId, newUser.fullName)

      setNewUser({ email: "", password: "", fullName: "", roleId: "" })
      setIsDialogOpen(false)
      await loadData()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleUpdateUserRole = async (userId: string, roleId: string) => {
    try {
      await permissionManager.updateUserRole(userId, roleId)
      await loadData()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("user_profiles").update({ is_active: !isActive }).eq("id", userId)

      if (error) throw error
      await loadData()
    } catch (error: any) {
      setError(error.message)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Carregando gerenciamento de usuários...</div>
  }

  return (
    <PermissionGuard permission="users.manage">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
            <p className="text-muted-foreground">Gerencie usuários e suas permissões</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>Adicione um novo usuário ao sistema</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@clinica.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Senha temporária"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="Nome completo do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select value={newUser.roleId} onValueChange={(value) => setNewUser({ ...newUser, roleId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name} - {role.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser} className="w-full">
                  Criar Usuário
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Users List */}
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.full_name || user.email}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      {user.role && (
                        <Badge variant="outline">
                          <Shield className="mr-1 h-3 w-3" />
                          {user.role.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={user.role_id || ""} onValueChange={(value) => handleUpdateUserRole(user.id, value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Função" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => toggleUserStatus(user.id, user.is_active)}>
                    {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Roles Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Funções e Permissões</CardTitle>
            <CardDescription>Visão geral das funções disponíveis no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Permissões ({role.permissions.length}):</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 6).map((permission) => (
                          <Badge key={permission.id} variant="secondary" className="text-xs">
                            {permission.name}
                          </Badge>
                        ))}
                        {role.permissions.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 6} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}
