import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      {/* 
          Role-specific sidebars are now defined in sub-layouts 
          (e.g., src/app/(dashboard)/deo/layout.tsx)
      */}
      {children}
    </SidebarProvider>
  )
}
