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
import "reactflow/dist/style.css"

interface PCSEntry {
  id: string
  title: string
  description: string
  category: "fundamental" | "important" | "care"
  patient_id: string
}

interface PCSMindmapProps {
  patientId: string
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

export default function PCSMindmap({ patientId }: PCSMindmapProps) {
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

  const generateNodesFromEntries = () => {
    const newNodes: Node[] = entries.map((entry, index) => {
      const angle = (index / entries.length) * 2 * Math.PI
      const radius = 200
      const x = Math.cos(angle) * radius + 400
      const y = Math.sin(angle) * radius + 300

      return {
        id: entry.id,
        type: "default",
        position: { x, y },
        data: {
          label: (
            <div className="p-2 text-center">
              <div className="font-medium text-sm">{entry.title}</div>
              {entry.description && (
                <div className="text-xs text-gray-600 mt-1 max-w-[150px] truncate">{entry.description}</div>
              )}
            </div>
          ),
        },
        style: {
          background: categoryColors[entry.category],
          border: `2px solid ${categoryBorderColors[entry.category]}`,
          borderRadius: "8px",
          width: 180,
          fontSize: "12px",
        },
      }
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
        <p>• Arraste os nós para reorganizar o mindmap</p>
        <p>• Clique e arraste entre nós para criar conexões</p>
        <p>• Use os controles para navegar e ajustar a visualização</p>
      </div>
    </div>
  )
}
