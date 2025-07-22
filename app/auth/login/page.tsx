"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Stethoscope, Mail } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError("Credenciais inválidas. Verifique seu email e senha.")
        return
      }

      // Check if user is approved
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("approval_status, first_name, last_name")
        .eq("id", data.user.id)
        .single()

      if (profileError || !profile) {
        // First time login - redirect to profile setup
        router.push("/auth/setup-profile")
        return
      }

      if (profile.approval_status === "pending") {
        setError("Sua conta ainda não foi aprovada. Aguarde a aprovação de um administrador.")
        await supabase.auth.signOut()
        return
      }

      if (profile.approval_status === "rejected") {
        setError("Sua conta foi rejeitada. Entre em contato com o administrador.")
        await supabase.auth.signOut()
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Digite seu email para recuperar a senha.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setResetEmailSent(true)
      setShowResetForm(false)
    } catch (error) {
      setError("Erro ao enviar email de recuperação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Email Enviado!</CardTitle>
            <CardDescription>
              Enviamos um link de recuperação para seu email. Verifique sua caixa de entrada e spam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setResetEmailSent(false)} className="w-full">
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistema PCS</CardTitle>
          <CardDescription>Planejamento Clínico Segmentado - Almare Odontologia</CardDescription>
        </CardHeader>
        <CardContent>
          {showResetForm ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email para Recuperação</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Link de Recuperação
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowResetForm(false)} className="w-full">
                Voltar ao Login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
              <div className="text-center">
                <Button type="button" variant="link" onClick={() => setShowResetForm(true)} className="text-sm">
                  Esqueceu sua senha?
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link href="/auth/register" className="text-blue-600 hover:underline">
                  Cadastre-se
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
