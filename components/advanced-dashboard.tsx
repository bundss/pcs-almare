"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar, TrendingUp, Clock, AlertTriangle } from "lucide-react"
import { format, subDays, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DashboardStats {
  totalPatients: number
  activePatients: number
  completedTreatments: number
  pendingTreatments: number
  weeklyGrowth: number
  urgentCases: number
}

export default function AdvancedDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    completedTreatments: 0,
    pendingTreatments: 0,
    weeklyGrowth: 0,
    urgentCases: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      // Get patients data
      const { data: patients } = await supabase.from("patients").select("*")

      // Get PCS entries data
      const { data: entries } = await supabase.from("pcs_entries").select("*")

      // Calculate stats
      const totalPatients = patients?.length || 0
      const activePatients = patients?.filter((p) => p.status === "active").length || 0

      // Calculate weekly growth
      const weekAgo = subDays(new Date(), 7)
      const recentPatients = patients?.filter((p) => isAfter(new Date(p.created_at), weekAgo)).length || 0

      const weeklyGrowth = totalPatients > 0 ? (recentPatients / totalPatients) * 100 : 0

      // Calculate treatments
      const fundamentalEntries = entries?.filter((e) => e.category === "fundamental") || []
      const urgentCases = fundamentalEntries.length

      setStats({
        totalPatients,
        activePatients,
        completedTreatments: Math.floor(totalPatients * 0.6), // Simulado
        pendingTreatments: Math.floor(totalPatients * 0.4), // Simulado
        weeklyGrowth: Math.round(weeklyGrowth),
        urgentCases,
      })
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Carregando estatísticas...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">+{stats.weeklyGrowth}% esta semana</p>
          </CardContent>
        </Card>

        {/* Active Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePatients}</div>
            <Progress value={(stats.activePatients / stats.totalPatients) * 100} className="mt-2" />
          </CardContent>
        </Card>

        {/* Treatments Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamentos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTreatments}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingTreatments} pendentes</p>
          </CardContent>
        </Card>

        {/* Urgent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgentCases}</div>
            <p className="text-xs text-muted-foreground">Requer atenção imediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Novo paciente cadastrado</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">PCS atualizado</p>
                <p className="text-xs text-muted-foreground">
                  {format(subDays(new Date(), 1), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Relatório gerado</p>
                <p className="text-xs text-muted-foreground">
                  {format(subDays(new Date(), 2), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
