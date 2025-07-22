"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewPatientPage() {
  const [formData, setFormData] = useState({
    name: "",
    status: "active",
    club_member: false,
    club_join_date: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase
        .from("patients")
        .insert([
          {
            ...formData,
            club_join_date: formData.club_member && formData.club_join_date ? formData.club_join_date : null,
            last_updated: new Date().toISOString(),
          },
        ])
        .select()

      if (error) throw error

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Erro ao criar paciente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Paciente</h1>
          <p className="text-muted-foreground">Cadastrar novo paciente no sistema PCS</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
          <CardDescription>Preencha os dados básicos do paciente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome completo do paciente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="club_member"
                  checked={formData.club_member}
                  onCheckedChange={(checked) => setFormData({ ...formData, club_member: checked as boolean })}
                />
                <Label htmlFor="club_member">Membro do Clube Viva Almare</Label>
              </div>

              {formData.club_member && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="club_join_date">Data de Adesão ao Clube</Label>
                  <Input
                    id="club_join_date"
                    type="date"
                    value={formData.club_join_date}
                    onChange={(e) => setFormData({ ...formData, club_join_date: e.target.value })}
                  />
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Paciente
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
