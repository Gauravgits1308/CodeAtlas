import * as React from "react"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-8 h-8 transition-transform duration-300 group-hover:scale-105" fill="none">
          <defs>
            <linearGradient id="nav-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3B82F6" />
              <stop offset="100%" stop-color="#8B5CF6" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="28" height="28" rx="8" fill="#111827" stroke="url(#nav-logo-grad)" stroke-width="1.5"/>
          <path d="M10 11L6 16L10 21" stroke="url(#nav-logo-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 11L26 16L22 21" stroke="url(#nav-logo-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="16" cy="16" r="3" fill="#F9FAFB"/>
          <path d="M16 8V11" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M16 21V24" stroke="#8B5CF6" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
        CodeAtlas
      </span>
    </Link>
  )
}
