"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <main className="w-full h-full flex flex-col p-4 md:p-8 overflow-y-auto min-h-screen bg-[#fdfdf8]">
      <header className="flex w-full min-h-12 items-center lg:hidden">
        <SidebarTrigger />
      </header>
      <div className="flex-1 w-full">
        {children}
      </div>
    </main>
  )
}
