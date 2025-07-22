"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ReactFlow, {
  type Node,
  addEdge,
  type Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from "reactflow"
import { Checkbox } from "@/components/ui/checkbox"
import { Check } from "lucide-react"
import "reactflow/dist/style.css"

interface PCSEntry {
  id: string
  title: string
  description: string
  category: "fundamental" | "important" | "care"
  is_completed: boolean
  patient_id: string
}

interface EnhancedPCSMindmapProps {
  patientId: string
  readOnly?: boolean
}

const categoryColors = {
  fundamental: "#fee2e2", // red-100
  important: "#fed7aa", // orange-100
  care: "#f3e8ff", // purple-100
}

const categoryBorderColors = {
  fundamental: "#fca5a5", // red-300
  important: "#fdba74", // orange-300
  care: "#c4b5fd", // purple-300
}

const completedColors = {
  fundamental: "#dcfce7", // green-100
  important: "#dcfce7", // green-100
  care: "#dcfce7", // green-100
}

const completedBorderColors = {
  fundamental: "#86efac", // green-300
  important: "#86efac", // green-300
  care: "#86efac", // green-300
}

export default function EnhancedPCSMindmap({ patientId, readOnly = false }: EnhancedPCSMindmapProps) {
  const [entries, setEntries] = useState<PCSEntry[]>([])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEntries()
  }, [patientId])

  useEffect(() => {
    if (entries.length > 0) {
      generateNodesFromEntries()
    }
  }, [entries])

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase.from("pcs_entries").select("*").eq("patient_id", patientId)

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error("Error fetching PCS entries:", error)
    } finally {
      setLoading(false)
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

      setEntries(entries.map((entry) => (entry.id === entryId ? { ...entry, is_completed: !currentStatus } : entry)))
    } catch (error) {
      console.error("Error toggling completion:", error)
    }
  }

  const generateNodesFromEntries = () => {
    const categorizedEntries = {
      fundamental: entries.filter((e) => e.category === "fundamental"),
      important: entries.filter((e) => e.category === "important"),
      care: entries.filter((e) => e.category === "care"),
    }

    const newNodes: Node[] = []
    let nodeIndex = 0

    // Position entries by category (column-based layout)
    Object.entries(categorizedEntries).forEach(([category, categoryEntries], columnIndex) => {
      categoryEntries.forEach((entry, rowIndex) => {
        const x = 100 + columnIndex * 300 // Column spacing
        const y = 100 + rowIndex * 120 // Row spacing within column

        const isCompleted = entry.is_completed
        const bgColor = isCompleted
          ? completedColors[entry.category as keyof typeof completedColors]
          : categoryColors[entry.category as keyof typeof categoryColors]
        const borderColor = isCompleted
          ? completedBorderColors[entry.category as keyof typeof completedBorderColors]
          : categoryBorderColors[entry.category as keyof typeof categoryBorderColors]

        newNodes.push({
          id: entry.id,
          type: "default",
          position: { x, y },
          data: {
            label: (
              <div className="p-3 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => handleToggleCompletion(entry.id, isCompleted)}
                    disabled={readOnly}
                  />
                  {isCompleted && <Check className="h-4 w-4 text-green-600" />}
                </div>
                <div className={`font-medium text-sm ${isCompleted ? "line-through text-green-700" : ""}`}>
                  {entry.title}
                </div>
                {entry.description && (
                  <div className={`text-xs text-gray-600 mt-1 max-w-[150px] ${isCompleted ? "line-through" : ""}`}>
                    {entry.description.length > 50 ? entry.description.substring(0, 50) + "..." : entry.description}
                  </div>
                )}
              </div>
            ),
          },
          style: {
            background: bgColor,
            border: `2px solid ${borderColor}`,
            borderRadius: "8px",
            width: 200,
            fontSize: "12px",
          },
        })
        nodeIndex++
      })
    })

    setNodes(newNodes)
  }

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  if (loading) {
    return <div className="flex justify-center p-8">Carregando mindmap...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mindmap PCS</h2>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: categoryColors.fundamental,
                borderColor: categoryBorderColors.fundamental,
              }}
            ></div>
            <span>Fundamentais</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: categoryColors.important,
                borderColor: categoryBorderColors.important,
              }}
            ></div>
            <span>Importantes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: categoryColors.care,
                borderColor: categoryBorderColors.care,
              }}
            ></div>
            <span>Cuidado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: completedColors.fundamental,
                borderColor: completedBorderColors.fundamental,
              }}
            ></div>
            <span>Concluído</span>
          </div>
        </div>
      </div>

      <div className="h-[600px] border rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>• Clique nos checkboxes para marcar procedimentos como concluídos</p>
        <p>• Arraste os nós para reorganizar o mindmap</p>
        <p>• Clique e arraste entre nós para criar conexões</p>
        <p>• Use os controles para navegar e ajustar a visualização</p>
      </div>
    </div>
  )
}
