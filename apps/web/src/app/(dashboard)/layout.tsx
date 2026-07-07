import * as React from "react"
import { Navbar } from "@/components/layout/Navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19]">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
