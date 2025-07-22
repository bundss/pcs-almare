"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import jsPDF from "jspdf"

interface PDFReportProps {
  patientId: string
  patientName: string
  entries: any[]
  comments: any[]
}

export default function PDFReport({ patientId, patientName, entries, comments }: PDFReportProps) {
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    setGenerating(true)

    try {
      const pdf = new jsPDF()

      // Header
      pdf.setFontSize(20)
      pdf.text("Relatório de Tratamento - PCS", 20, 30)

      pdf.setFontSize(14)
      pdf.text(`Paciente: ${patientName}`, 20, 50)
      pdf.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 65)

      // PCS Entries
      let yPosition = 90
      pdf.setFontSize(16)
      pdf.text("Planejamento Clínico Segmentado:", 20, yPosition)
      yPosition += 20

      const categories = {
        fundamental: "Pontos Fundamentais",
        important: "Pontos Importantes",
        care: "Pontos de Cuidado",
      }

      Object.entries(categories).forEach(([key, name]) => {
        const categoryEntries = entries.filter((e) => e.category === key)
        if (categoryEntries.length > 0) {
          pdf.setFontSize(14)
          pdf.text(name, 20, yPosition)
          yPosition += 15

          categoryEntries.forEach((entry) => {
            pdf.setFontSize(12)
            pdf.text(`• ${entry.title}`, 25, yPosition)
            yPosition += 10
            if (entry.description) {
              pdf.setFontSize(10)
              pdf.text(`  ${entry.description}`, 30, yPosition)
              yPosition += 10
            }
          })
          yPosition += 10
        }
      })

      // Comments
      if (comments.length > 0) {
        yPosition += 10
        pdf.setFontSize(16)
        pdf.text("Comentários:", 20, yPosition)
        yPosition += 20

        comments.forEach((comment) => {
          pdf.setFontSize(12)
          pdf.text(
            `${comment.author_name} - ${new Date(comment.created_at).toLocaleDateString("pt-BR")}`,
            20,
            yPosition,
          )
          yPosition += 10
          pdf.setFontSize(10)
          pdf.text(comment.content, 25, yPosition)
          yPosition += 15
        })
      }

      // Save PDF
      pdf.save(`relatorio-${patientName.replace(/\s+/g, "-")}-${Date.now()}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button onClick={generatePDF} disabled={generating} variant="outline">
      {generating ? (
        <>
          <FileText className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Gerar Relatório PDF
        </>
      )}
    </Button>
  )
}
