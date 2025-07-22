import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export const supabase = createClientComponentClient()

export type Database = {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string
          name: string
          status: "active" | "inactive"
          club_member: boolean
          club_join_date: string | null
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: "active" | "inactive"
          club_member?: boolean
          club_join_date?: string | null
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: "active" | "inactive"
          club_member?: boolean
          club_join_date?: string | null
          last_updated?: string
          created_at?: string
        }
      }
      pcs_entries: {
        Row: {
          id: string
          patient_id: string
          title: string
          description: string | null
          category: "fundamental" | "important" | "care"
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          title: string
          description?: string | null
          category: "fundamental" | "important" | "care"
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          title?: string
          description?: string | null
          category?: "fundamental" | "important" | "care"
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      patient_comments: {
        Row: {
          id: string
          patient_id: string
          content: string
          author_name: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          content: string
          author_name: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          content?: string
          author_name?: string
          created_at?: string
        }
      }
    }
  }
}
