import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Controlador de Perdas - PDV | VENCIMENTO | ARMAZEN | ENTREGA",
  description: "Aplicativo para registrar e documentar perdas por: Troca PDV - Vencimento - Perda no Armazém - Perda na Entrega",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
