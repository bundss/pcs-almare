import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { PermissionProvider } from "@/hooks/use-permissions"
import Navbar from "@/components/navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema PCS - Planejamento Clínico Segmentado",
  description: "Sistema de gerenciamento para clínicas odontológicas",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <PermissionProvider>
            <div className="min-h-screen bg-background">
              <Navbar />
              <main>{children}</main>
            </div>
          </PermissionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
