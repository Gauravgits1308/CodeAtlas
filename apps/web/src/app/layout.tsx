import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { AppProviders } from "@/providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "CodeAtlas - Understand Any Codebase Instantly",
  description:
    "CodeAtlas helps developers understand software repositories using AI-powered intelligence.",
  keywords: ["CodeAtlas", "codebase intelligence", "semantic search", "developer documentation"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        style={{ colorScheme: "dark" }}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
          <AppProviders>
            {children}
          </AppProviders>
        </body>
      </html>
    </ClerkProvider>
  )
}
