"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Comment {
  id: string
  content: string
  author_name: string
  created_at: string
  patient_id: string
}

interface CommentsSectionProps {
  patientId: string
}

export default function CommentsSection({ patientId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchComments()
  }, [patientId])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_comments")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from("patient_comments")
        .insert([
          {
            content: newComment,
            patient_id: patientId,
            author_name: user?.email || "Usuário",
          },
        ])
        .select()

      if (error) throw error

      setComments([data[0], ...comments])
      setNewComment("")
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Carregando comentários...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Adicionar Comentário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite seu comentário sobre o PCS do paciente..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button onClick={handleSubmitComment} disabled={!newComment.trim() || submitting} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            {submitting ? "Enviando..." : "Enviar Comentário"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comentários ({comments.length})</h3>

        {comments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{comment.author_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{comment.author_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
