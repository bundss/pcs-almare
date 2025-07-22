"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Download, FileText, Edit } from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Patient {
  id: string
  name: string
  status: string
  created_at: string
}

interface PCSEntry {
  id: string
  title: string
  description: string
  category: "fundamental" | "important" | "care"
  is_completed: boolean
}

const categoryNames = {
  fundamental: "Pontos Fundamentais",
  important: "Pontos Importantes",
  care: "Pontos de Cuidado",
}

export default function ReportEditorPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [entries, setEntries] = useState<PCSEntry[]>([])
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [reportData, setReportData] = useState({
    title: "PCS - Planejamento Clínico Segmentado - Almare Odontologia",
    description:
      "O PCS – Planejamento Clínico Segmentado – é o jeito mais inteligente, leve e respeitoso de cuidar do seu sorriso. Nada de tratamentos atropelados ou decisões no escuro. Aqui, cada etapa do plano é organizada com clareza, prioridades bem definidas e no seu ritmo, respeitando sua saúde, seu tempo e seu investimento. É um mapa completo, feito sob medida, que guia você com segurança até o seu melhor sorriso — com transparência, previsibilidade e, acima de tudo, cuidado de verdade.",
    patientName: "",
    pcsDate: "",
    boardVersion: "1.0",
    mindmapVersion: "1.0",
  })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (params.patientId) {
      fetchPatientData()
    }
  }, [params.patientId])

  const fetchPatientData = async () => {
    try {
      // Get patient data
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", params.patientId)
        .single()

      if (patientError) throw patientError

      // Get PCS entries
      const { data: entriesData, error: entriesError } = await supabase
        .from("pcs_entries")
        .select("*")
        .eq("patient_id", params.patientId)
        .order("category, order_index")

      if (entriesError) throw entriesError

      setPatient(patientData)
      setEntries(entriesData || [])
      setSelectedEntries((entriesData || []).map((e) => e.id))
      setReportData((prev) => ({
        ...prev,
        patientName: patientData.name,
        pcsDate: format(new Date(patientData.created_at), "dd/MM/yyyy", { locale: ptBR }),
      }))
    } catch (error) {
      console.error("Error fetching patient data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries((prev) => (prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]))
  }

  const generatePDF = async () => {
    setGenerating(true)

    try {
      const pdf = new jsPDF()

      // Define colors (RGB values converted to 0-1 scale for jsPDF)
      const colors = {
        primary: [137 / 255, 185 / 255, 182 / 255], // rgb(137,185,182)
        secondary: [28 / 255, 38 / 255, 50 / 255], // rgb(28,38,50)
        accent: [255 / 255, 237 / 255, 218 / 255], // rgb(255,237,218)
        black: [0, 0, 0],
        white: [1, 1, 1],
      }

      // Set up the document
      pdf.setFillColor(...colors.accent)
      pdf.rect(0, 0, 210, 297, "F") // A4 background

      // Header section
      pdf.setFillColor(...colors.primary)
      pdf.rect(0, 0, 210, 40, "F")

      pdf.setTextColor(...colors.secondary)
      pdf.setFontSize(20)
      pdf.setFont("helvetica", "bold")
      pdf.text(reportData.title, 105, 20, { align: "center" })

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text("Almare Odontologia", 105, 30, { align: "center" })

      // Description section
      pdf.setTextColor(...colors.black)
      pdf.setFontSize(10)
      const splitDescription = pdf.splitTextToSize(reportData.description, 170)
      pdf.text(splitDescription, 20, 55)

      // Patient info section
      let yPosition = 55 + splitDescription.length * 5 + 15

      pdf.setFillColor(...colors.secondary)
      pdf.rect(20, yPosition, 170, 25, "F")

      pdf.setTextColor(...colors.white)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text(`Paciente: ${reportData.patientName}`, 25, yPosition + 10)

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Data do PCS: ${reportData.pcsDate}`, 25, yPosition + 18)
      pdf.text(
        `Versão Board: ${reportData.boardVersion} | Versão Mindmap: ${reportData.mindmapVersion}`,
        25,
        yPosition + 23,
      )

      // PCS Entries section
      yPosition += 40
      pdf.setTextColor(...colors.black)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("Planejamento Clínico Segmentado", 20, yPosition)
      yPosition += 15

      const selectedEntriesData = entries.filter((e) => selectedEntries.includes(e.id))
      const categorizedEntries = {
        fundamental: selectedEntriesData.filter((e) => e.category === "fundamental"),
        important: selectedEntriesData.filter((e) => e.category === "important"),
        care: selectedEntriesData.filter((e) => e.category === "care"),
      }

      Object.entries(categorizedEntries).forEach(([category, categoryEntries]) => {
        if (categoryEntries.length > 0) {
          // Category header
          pdf.setFillColor(...colors.primary)
          pdf.rect(20, yPosition - 5, 170, 12, "F")

          pdf.setTextColor(...colors.secondary)
          pdf.setFontSize(12)
          pdf.setFont("helvetica", "bold")
          pdf.text(categoryNames[category as keyof typeof categoryNames], 25, yPosition + 3)
          yPosition += 20

          // Category entries
          categoryEntries.forEach((entry) => {
            pdf.setTextColor(...colors.black)
            pdf.setFontSize(10)
            pdf.setFont("helvetica", "bold")

            // Check if we need a new page
            if (yPosition > 250) {
              pdf.addPage()
              pdf.setFillColor(...colors.accent)
              pdf.rect(0, 0, 210, 297, "F")
              yPosition = 30
            }

            const statusIcon = entry.is_completed ? "✓" : "○"
            pdf.text(`${statusIcon} ${entry.title}`, 25, yPosition)
            yPosition += 8

            if (entry.description) {
              pdf.setFont("helvetica", "normal")
              pdf.setFontSize(9)
              const splitDesc = pdf.splitTextToSize(entry.description, 160)
              pdf.text(splitDesc, 30, yPosition)
              yPosition += splitDesc.length * 4 + 5
            } else {
              yPosition += 5
            }
          })
          yPosition += 10
        }
      })

      // Footer
      const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      pdf.setFillColor(...colors.secondary)
      pdf.rect(0, 270, 210, 27, "F")

      pdf.setTextColor(...colors.white)
      pdf.setFontSize(10)
      pdf.text(`Relatório gerado em ${today}`, 105, 285, { align: "center" })
      pdf.text("Almare Odontologia - Sistema PCS", 105, 292, { align: "center" })

      // Save PDF
      pdf.save(`PCS-${reportData.patientName.replace(/\s+/g, "-")}-${Date.now()}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    } finally {
      setGenerating(false)
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
      <div className="flex items-center space-x-4">
        <Link href={`/patients/${patient.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editor de Relatório</h1>
          <p className="text-muted-foreground">Personalize o relatório antes de gerar o PDF</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Edit className="mr-2 h-5 w-5" />
              Editar Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Relatório</Label>
              <Input
                id="title"
                value={reportData.title}
                onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição do PCS</Label>
              <Textarea
                id="description"
                value={reportData.description}
                onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="boardVersion">Versão Board</Label>
                <Input
                  id="boardVersion"
                  value={reportData.boardVersion}
                  onChange={(e) => setReportData({ ...reportData, boardVersion: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mindmapVersion">Versão Mindmap</Label>
                <Input
                  id="mindmapVersion"
                  value={reportData.mindmapVersion}
                  onChange={(e) => setReportData({ ...reportData, mindmapVersion: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entry Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Procedimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryNames).map(([category, name]) => {
                const categoryEntries = entries.filter((e) => e.category === category)
                if (categoryEntries.length === 0) return null

                return (
                  <div key={category}>
                    <h4 className="font-semibold mb-2">{name}</h4>
                    <div className="space-y-2 ml-4">
                      {categoryEntries.map((entry) => (
                        <div key={entry.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={entry.id}
                            checked={selectedEntries.includes(entry.id)}
                            onCheckedChange={() => toggleEntrySelection(entry.id)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={entry.id} className="font-medium cursor-pointer">
                              {entry.title}
                              {entry.is_completed && <span className="ml-2 text-green-600">✓</span>}
                            </Label>
                            {entry.description && (
                              <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate PDF Button */}
      <div className="flex justify-center">
        <Button onClick={generatePDF} disabled={generating || selectedEntries.length === 0} size="lg">
          {generating ? (
            <>
              <FileText className="mr-2 h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Gerar Relatório PDF ({selectedEntries.length} procedimentos)
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
