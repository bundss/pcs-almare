"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, User, Eye, Lock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import EnhancedPCSBoard from "@/components/enhanced-pcs-board"
import EnhancedPCSMindmap from "@/components/enhanced-pcs-mindmap"

interface Patient {
  id: string
  name: string
  status: string
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

export default function PublicPatientPage() {
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (params.id && params.token) {
      fetchPatientByToken()
    }
  }, [params.id, params.token])

  const fetchPatientByToken = async () => {
    try {
      // Verify token and get patient
      const { data: tokenData, error: tokenError } = await supabase
        .from("patient_public_tokens")
        .select("patient_id, expires_at")
        .eq("token", params.token)
        .eq("patient_id", params.id)
        .single()

      if (tokenError || !tokenData) {
        setError("Link inválido ou expirado.")
        return
      }

      // Check if token is expired
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        setError("Link expirado.")
        return
      }

      // Get patient data
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", params.id)
        .single()

      if (patientError || !patientData) {
        setError("Paciente não encontrado.")
        return
      }

      setPatient(patientData)
    } catch (error) {
      console.error("Error fetching patient:", error)
      setError("Erro ao carregar dados do paciente.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h1 className="text-2xl font-bold mb-4">Paciente não encontrado</h1>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-blue-100 rounded-full">
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Visualização do Planejamento</h1>
          <p className="text-muted-foreground">Almare Odontologia - Sistema PCS</p>
        </div>
      </div>

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center">
            <User className="mr-2 h-5 w-5" />
            {patient.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status do Tratamento</p>
            <Badge variant={patient.status === "discharged" ? "default" : "secondary"} className="mt-1">
              {statusLabels[patient.status as keyof typeof statusLabels] || patient.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
            <p className="text-lg">{format(new Date(patient.last_updated), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
          {patient.club_member && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Membro Especial</p>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600 mt-1">
                <Crown className="mr-1 h-3 w-3" />
                Clube Viva Almare
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PCS Tabs */}
      <Tabs defaultValue="board" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="board">Planejamento (Board)</TabsTrigger>
          <TabsTrigger value="mindmap">Mapa Mental</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <EnhancedPCSBoard patientId={patient.id} readOnly={true} />
        </TabsContent>

        <TabsContent value="mindmap">
          <EnhancedPCSMindmap patientId={patient.id} readOnly={true} />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Este é um link de visualização do seu planejamento clínico.
            <br />
            Para mais informações, entre em contato com a Almare Odontologia.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
