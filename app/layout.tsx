import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MeetingProvider } from "@/context/meeting-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Living Canvas - AI-Enhanced Meeting Interface",
  description: "A dynamic and adaptive canvas for AI-enhanced meetings",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MeetingProvider>{children}</MeetingProvider>
      </body>
    </html>
  )
}
