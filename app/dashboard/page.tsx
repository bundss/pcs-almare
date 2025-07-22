"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Users, Calendar, Activity, Crown, FileText, Share } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

interface Patient {
  id: string
  name: string
  status: "analysis" | "treatment" | "discharged" | "inactive"
  last_updated: string
  club_member: boolean
  club_join_date?: string
  created_at: string
}

const statusLabels = {
  analysis: "Em Análise",
  treatment: "Em Tratamento",
  discharged: "Alta",
  inactive: "Inativo",
}

const statusColors = {
  analysis: "bg-yellow-100 text-yellow-800",
  treatment: "bg-blue-100 text-blue-800",
  discharged: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase.from("patients").select("*").order("last_updated", { ascending: false })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error("Error fetching patients:", error)
    } finally {
      setLoading(false)
    }
  }

  const updatePatientStatus = async (patientId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("patients")
        .update({ status: newStatus, last_updated: new Date().toISOString() })
        .eq("id", patientId)

      if (error) throw error

      setPatients(
        patients.map((p) =>
          p.id === patientId ? { ...p, status: newStatus as any, last_updated: new Date().toISOString() } : p,
        ),
      )

      toast.success("Status do paciente atualizado!")
    } catch (error) {
      console.error("Error updating patient status:", error)
      toast.error("Erro ao atualizar status do paciente")
    }
  }

  const generatePublicLink = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from("patient_public_tokens")
        .select("token")
        .eq("patient_id", patientId)
        .single()

      if (error) throw error

      const publicUrl = `${window.location.origin}/patients/${patientId}/public/${data.token}`
      await navigator.clipboard.writeText(publicUrl)
      toast.success("Link público copiado para a área de transferência!")
    } catch (error) {
      console.error("Error generating public link:", error)
      toast.error("Erro ao gerar link público")
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: patients.length,
    analysis: patients.filter((p) => p.status === "analysis").length,
    treatment: patients.filter((p) => p.status === "treatment").length,
    discharged: patients.filter((p) => p.status === "discharged").length,
    clubMembers: patients.filter((p) => p.club_member).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard PCS</h1>
          <p className="text-muted-foreground">Gerenciamento de Planejamento Clínico Segmentado</p>
        </div>
        <Link href="/patients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.analysis}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Tratamento</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.treatment}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.discharged}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clube Viva Almare</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clubMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pacientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="analysis">Em Análise</SelectItem>
            <SelectItem value="treatment">Em Tratamento</SelectItem>
            <SelectItem value="discharged">Alta</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Patient List */}
      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Nenhum paciente encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Última atualização: {format(new Date(patient.last_updated), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={patient.status} onValueChange={(value) => updatePatientStatus(patient.id, value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analysis">Em Análise</SelectItem>
                      <SelectItem value="treatment">Em Tratamento</SelectItem>
                      <SelectItem value="discharged">Alta</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>

                  {patient.club_member && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <Crown className="mr-1 h-3 w-3" />
                      Clube
                    </Badge>
                  )}

                  <Button variant="outline" size="sm" onClick={() => generatePublicLink(patient.id)}>
                    <Share className="mr-1 h-3 w-3" />
                    Compartilhar
                  </Button>

                  <Link href={`/reports/${patient.id}`}>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-1 h-3 w-3" />
                      Relatório
                    </Button>
                  </Link>

                  <Link href={`/patients/${patient.id}`}>
                    <Button variant="outline" size="sm">
                      Ver PCS
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
