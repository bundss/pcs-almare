"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, Crown } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Patient {
  id: string
  name: string
  status: "active" | "inactive"
  club_member: boolean
  last_updated: string
}

export default function PatientSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = patients.filter((patient) => patient.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients([])
    }
  }, [searchTerm, patients])

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase.from("patients").select("*").order("name")

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error("Error loading patients:", error)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchTerm.trim() && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto">
          {filteredPatients.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                {filteredPatients.map((patient) => (
                  <Link key={patient.id} href={`/patients/${patient.id}`}>
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{patient.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Atualizado: {format(new Date(patient.last_updated), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                          {patient.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                        {patient.club_member && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <Crown className="mr-1 h-3 w-3" />
                            Clube
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">Nenhum paciente encontrado</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
