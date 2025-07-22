"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SimplePermissionGuard from "@/components/simple-permission-guard"

export default function UsersPage() {
  return (
    <SimplePermissionGuard show={true}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Administração</h1>
            <p className="text-muted-foreground">Gerenciamento de usuários e permissões</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sistema de Permissões</CardTitle>
            <CardDescription>
              O sistema de permissões avançado está sendo configurado. Por enquanto, todos os usuários autenticados têm
              acesso completo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900">Próximas Funcionalidades:</h3>
                <ul className="mt-2 space-y-1 text-blue-800">
                  <li>• Criação de usuários com diferentes funções</li>
                  <li>• Controle granular de permissões</li>
                  <li>• Funções: Admin, Dentista, Assistente, Recepcionista</li>
                  <li>• Gerenciamento de acesso por recurso</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900">Funcionalidades Ativas:</h3>
                <ul className="mt-2 space-y-1 text-green-800">
                  <li>• ✅ Sistema de autenticação</li>
                  <li>• ✅ Gerenciamento de pacientes</li>
                  <li>• ✅ Planejamento Clínico Segmentado (PCS)</li>
                  <li>• ✅ Sistema de comentários</li>
                  <li>• ✅ Dashboards interativos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SimplePermissionGuard>
  )
}
