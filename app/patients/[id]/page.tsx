"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Crown, User, MessageSquare } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import PCSBoard from "@/components/pcs-board"
import PCSMindmap from "@/components/pcs-mindmap"
import CommentsSection from "@/components/comments-section"
import PDFReport from "@/components/pdf-report"

interface Patient {
  id: string
  name: string
  status: "active" | "inactive"
  last_updated: string
  club_member: boolean
  club_join_date?: string
  created_at: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (params.id) {
      fetchPatient()
    }
  }, [params.id])

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase.from("patients").select("*").eq("id", params.id).single()

      if (error) throw error
      setPatient(data)
    } catch (error) {
      console.error("Error fetching patient:", error)
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

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Paciente não encontrado</h1>
          <Link href="/dashboard">
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{patient.name}</h1>
            <p className="text-muted-foreground">Planejamento Clínico Segmentado</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={patient.status === "active" ? "default" : "secondary"}>
            {patient.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
          {patient.club_member && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <Crown className="mr-1 h-3 w-3" />
              Clube Viva Almare
            </Badge>
          )}
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Informações do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-lg">{patient.status === "active" ? "Ativo" : "Inativo"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
            <p className="text-lg">{format(new Date(patient.last_updated), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
          </div>
          {patient.club_member && patient.club_join_date && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Adesão ao Clube</p>
              <p className="text-lg">{format(new Date(patient.club_join_date), "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PCS Tabs */}
      <Tabs defaultValue="board" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="board">Board PCS</TabsTrigger>
          <TabsTrigger value="mindmap">Mindmap</TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="mr-2 h-4 w-4" />
            Comentários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <PCSBoard patientId={patient.id} />
        </TabsContent>

        <TabsContent value="mindmap">
          <PCSMindmap patientId={patient.id} />
        </TabsContent>

        <TabsContent value="comments">
          <CommentsSection patientId={patient.id} />
        </TabsContent>
      </Tabs>
      <div className="flex justify-end">
        <PDFReport
          patientId={patient.id}
          patientName={patient.name}
          entries={[]} // Você precisará buscar as entries
          comments={[]} // Você precisará buscar os comments
        />
      </div>
    </div>
  )
}
