"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, GripVertical, Check, History } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PCSEntry {
  id: string
  title: string
  description: string
  category: "fundamental" | "important" | "care"
  order_index: number
  patient_id: string
  is_completed: boolean
  completed_at?: string
  completed_by?: string
  created_at: string
}

interface ChangeLogEntry {
  id: string
  action: string
  description: string
  user_name: string
  created_at: string
}

interface EnhancedPCSBoardProps {
  patientId: string
  readOnly?: boolean
}

const categories = {
  fundamental: { name: "Pontos Fundamentais", color: "bg-red-100 border-red-300", textColor: "text-red-800" },
  important: { name: "Pontos Importantes", color: "bg-orange-100 border-orange-300", textColor: "text-orange-800" },
  care: { name: "Pontos de Cuidado", color: "bg-purple-100 border-purple-300", textColor: "text-purple-800" },
}

export default function EnhancedPCSBoard({ patientId, readOnly = false }: EnhancedPCSBoardProps) {
  const [entries, setEntries] = useState<PCSEntry[]>([])
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newEntry, setNewEntry] = useState({ title: "", description: "", category: "fundamental" as const })
  const [editingEntry, setEditingEntry] = useState<PCSEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showChangeLog, setShowChangeLog] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEntries()
    fetchChangeLog()
  }, [patientId])

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("pcs_entries")
        .select("*")
        .eq("patient_id", patientId)
        .order("order_index")

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error("Error fetching PCS entries:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChangeLog = async () => {
    try {
      const { data, error } = await supabase
        .from("pcs_change_log")
        .select(`
          *,
          user_profiles!pcs_change_log_user_id_fkey(first_name, last_name, email)
        `)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      const formattedLog =
        data?.map((log) => ({
          id: log.id,
          action: log.action,
          description: log.description,
          user_name: log.user_profiles
            ? `${log.user_profiles.first_name || ""} ${log.user_profiles.last_name || ""}`.trim() ||
              log.user_profiles.email
            : "Sistema",
          created_at: log.created_at,
        })) || []

      setChangeLog(formattedLog)
    } catch (error) {
      console.error("Error fetching change log:", error)
    }
  }

  const handleToggleCompletion = async (entryId: string, currentStatus: boolean) => {
    if (readOnly) return

    try {
      const { error } = await supabase
        .from("pcs_entries")
        .update({
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
          completed_by: !currentStatus ? (await supabase.auth.getUser()).data.user?.id : null,
        })
        .eq("id", entryId)

      if (error) throw error

      setEntries(
        entries.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                is_completed: !currentStatus,
                completed_at: !currentStatus ? new Date().toISOString() : undefined,
              }
            : entry,
        ),
      )

      // Refresh change log
      fetchChangeLog()
    } catch (error) {
      console.error("Error toggling completion:", error)
    }
  }

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || readOnly) return

    try {
      const maxOrder = Math.max(
        ...entries.filter((e) => e.category === newEntry.category).map((e) => e.order_index),
        -1,
      )

      const { data, error } = await supabase
        .from("pcs_entries")
        .insert([
          {
            ...newEntry,
            patient_id: patientId,
            order_index: maxOrder + 1,
          },
        ])
        .select()

      if (error) throw error

      setEntries([...entries, data[0]])
      setNewEntry({ title: "", description: "", category: "fundamental" })
      setIsDialogOpen(false)
      fetchChangeLog()
    } catch (error) {
      console.error("Error adding entry:", error)
    }
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry || !editingEntry.title.trim() || readOnly) return

    try {
      const { data, error } = await supabase
        .from("pcs_entries")
        .update({
          title: editingEntry.title,
          description: editingEntry.description,
        })
        .eq("id", editingEntry.id)
        .select()

      if (error) throw error

      setEntries(entries.map((e) => (e.id === editingEntry.id ? data[0] : e)))
      setEditingEntry(null)
      fetchChangeLog()
    } catch (error) {
      console.error("Error updating entry:", error)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (readOnly) return

    try {
      const { error } = await supabase.from("pcs_entries").delete().eq("id", entryId)

      if (error) throw error

      setEntries(entries.filter((e) => e.id !== entryId))
      fetchChangeLog()
    } catch (error) {
      console.error("Error deleting entry:", error)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination || readOnly) return

    const { source, destination } = result
    const sourceCategory = source.droppableId as keyof typeof categories
    const destCategory = destination.droppableId as keyof typeof categories

    const newEntries = [...entries]
    const [movedEntry] = newEntries.splice(
      newEntries.findIndex((e) => e.id === result.draggableId),
      1,
    )

    movedEntry.category = destCategory
    movedEntry.order_index = destination.index

    const destEntries = newEntries.filter((e) => e.category === destCategory)
    destEntries.splice(destination.index, 0, movedEntry)

    destEntries.forEach((entry, index) => {
      entry.order_index = index
    })

    setEntries(newEntries)

    try {
      const { error } = await supabase
        .from("pcs_entries")
        .update({
          category: destCategory,
          order_index: destination.index,
        })
        .eq("id", result.draggableId)

      if (error) throw error
      fetchChangeLog()
    } catch (error) {
      console.error("Error updating entry position:", error)
      fetchEntries()
    }
  }

  const getEntriesByCategory = (category: keyof typeof categories) => {
    return entries.filter((entry) => entry.category === category).sort((a, b) => a.order_index - b.order_index)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planejamento Clínico Segmentado</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowChangeLog(!showChangeLog)}>
            <History className="mr-2 h-4 w-4" />
            Log de Alterações
          </Button>
          {!readOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Entrada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Entrada PCS</DialogTitle>
                  <DialogDescription>Adicione uma nova entrada ao planejamento clínico</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                      placeholder="Digite o título da entrada"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                      placeholder="Digite a descrição detalhada"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <select
                      id="category"
                      value={newEntry.category}
                      onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value as any })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="fundamental">Pontos Fundamentais</option>
                      <option value="important">Pontos Importantes</option>
                      <option value="care">Pontos de Cuidado</option>
                    </select>
                  </div>
                  <Button onClick={handleAddEntry} className="w-full">
                    Adicionar Entrada
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Change Log */}
      {showChangeLog && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Log de Alterações</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {changeLog.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">{log.description}</p>
                    <p className="text-muted-foreground">
                      {log.user_name} • {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
              {changeLog.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Nenhuma alteração registrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(categories).map(([key, category]) => (
            <div key={key} className="space-y-4">
              <div className={`p-4 rounded-lg ${category.color}`}>
                <h3 className={`font-semibold ${category.textColor}`}>{category.name}</h3>
                <p className={`text-sm ${category.textColor} opacity-80`}>
                  {getEntriesByCategory(key as keyof typeof categories).length} entradas
                </p>
              </div>

              <Droppable droppableId={key} isDropDisabled={readOnly}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] space-y-2 p-2 rounded-lg border-2 border-dashed transition-colors ${
                      snapshot.isDraggingOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    {getEntriesByCategory(key as keyof typeof categories).map((entry, index) => (
                      <Draggable key={entry.id} draggableId={entry.id} index={index} isDragDisabled={readOnly}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`transition-shadow ${
                              snapshot.isDragging ? "shadow-lg" : "hover:shadow-md"
                            } ${entry.is_completed ? "bg-green-50 border-green-200" : ""}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div className="flex items-center space-x-2">
                                    {!readOnly && (
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                      </div>
                                    )}
                                    <Checkbox
                                      checked={entry.is_completed}
                                      onCheckedChange={() => handleToggleCompletion(entry.id, entry.is_completed)}
                                      disabled={readOnly}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h4
                                      className={`font-medium ${entry.is_completed ? "line-through text-green-700" : ""}`}
                                    >
                                      {entry.title}
                                    </h4>
                                    {entry.description && (
                                      <p
                                        className={`text-sm text-muted-foreground mt-1 ${entry.is_completed ? "line-through" : ""}`}
                                      >
                                        {entry.description}
                                      </p>
                                    )}
                                    {entry.is_completed && entry.completed_at && (
                                      <div className="flex items-center space-x-1 mt-2 text-xs text-green-600">
                                        <Check className="h-3 w-3" />
                                        <span>
                                          Concluído em{" "}
                                          {format(new Date(entry.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {!readOnly && (
                                  <div className="flex space-x-1">
                                    <Button variant="ghost" size="sm" onClick={() => setEditingEntry(entry)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Edit Dialog */}
      {editingEntry && !readOnly && (
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Entrada</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editingEntry.description}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateEntry}>Salvar</Button>
                <Button variant="outline" onClick={() => setEditingEntry(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
