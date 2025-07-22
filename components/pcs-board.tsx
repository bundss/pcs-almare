"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, GripVertical } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface PCSEntry {
  id: string
  title: string
  description: string
  category: "fundamental" | "important" | "care"
  order_index: number
  patient_id: string
  created_at: string
}

interface PCSBoardProps {
  patientId: string
}

const categories = {
  fundamental: { name: "Pontos Fundamentais", color: "bg-red-100 border-red-300", textColor: "text-red-800" },
  important: { name: "Pontos Importantes", color: "bg-orange-100 border-orange-300", textColor: "text-orange-800" },
  care: { name: "Pontos de Cuidado", color: "bg-purple-100 border-purple-300", textColor: "text-purple-800" },
}

export default function PCSBoard({ patientId }: PCSBoardProps) {
  const [entries, setEntries] = useState<PCSEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newEntry, setNewEntry] = useState({ title: "", description: "", category: "fundamental" as const })
  const [editingEntry, setEditingEntry] = useState<PCSEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEntries()
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

  const handleAddEntry = async () => {
    if (!newEntry.title.trim()) return

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
    } catch (error) {
      console.error("Error adding entry:", error)
    }
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry || !editingEntry.title.trim()) return

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
    } catch (error) {
      console.error("Error updating entry:", error)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase.from("pcs_entries").delete().eq("id", entryId)

      if (error) throw error

      setEntries(entries.filter((e) => e.id !== entryId))
    } catch (error) {
      console.error("Error deleting entry:", error)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination } = result
    const sourceCategory = source.droppableId as keyof typeof categories
    const destCategory = destination.droppableId as keyof typeof categories

    // Create a copy of entries
    const newEntries = [...entries]
    const [movedEntry] = newEntries.splice(
      newEntries.findIndex((e) => e.id === result.draggableId),
      1,
    )

    // Update the entry's category and position
    movedEntry.category = destCategory
    movedEntry.order_index = destination.index

    // Insert at new position
    const destEntries = newEntries.filter((e) => e.category === destCategory)
    destEntries.splice(destination.index, 0, movedEntry)

    // Update order indices for the destination category
    destEntries.forEach((entry, index) => {
      entry.order_index = index
    })

    setEntries(newEntries)

    // Update in database
    try {
      const { error } = await supabase
        .from("pcs_entries")
        .update({
          category: destCategory,
          order_index: destination.index,
        })
        .eq("id", result.draggableId)

      if (error) throw error
    } catch (error) {
      console.error("Error updating entry position:", error)
      // Revert on error
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
      </div>

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

              <Droppable droppableId={key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] space-y-2 p-2 rounded-lg border-2 border-dashed transition-colors ${
                      snapshot.isDraggingOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    {getEntriesByCategory(key as keyof typeof categories).map((entry, index) => (
                      <Draggable key={entry.id} draggableId={entry.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`cursor-move transition-shadow ${
                              snapshot.isDragging ? "shadow-lg" : "hover:shadow-md"
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <h4 className="font-medium">{entry.title}</h4>
                                  </div>
                                  {entry.description && (
                                    <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>
                                  )}
                                </div>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="sm" onClick={() => setEditingEntry(entry)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
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
      {editingEntry && (
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
