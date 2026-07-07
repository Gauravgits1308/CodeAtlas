import * as React from "react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Center Branding */}
      <div className="mb-8 relative z-10 flex flex-col items-center gap-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-8 h-8 transition-transform duration-300 group-hover:scale-105" fill="none">
              <defs>
                <linearGradient id="auth-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#3B82F6" />
                  <stop offset="100%" stop-color="#8B5CF6" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="28" height="28" rx="8" fill="#111827" stroke="url(#auth-logo-grad)" stroke-width="1.5"/>
              <path d="M10 11L6 16L10 21" stroke="url(#auth-logo-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 11L26 16L22 21" stroke="url(#auth-logo-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="16" cy="16" r="3" fill="#F9FAFB"/>
              <path d="M16 8V11" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M16 21V24" stroke="#8B5CF6" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
            CodeAtlas
          </span>
        </Link>
      </div>

      {/* Main card box container */}
      <div className="relative z-10 w-full max-w-md bg-card/40 backdrop-blur-md border border-border/40 p-8 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        {children}
      </div>
    </div>
  )
}
