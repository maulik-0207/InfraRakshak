"use client"

import { useAuthStore } from "@/store/auth-store"
import { DeoSidebar } from "./sidebars/deo-sidebar"
import { SchoolSidebar } from "./sidebars/school-sidebar"
import { StaffSidebar } from "./sidebars/staff-sidebar"
import { ContractorSidebar } from "./sidebars/contractor-sidebar"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { SidebarHeader } from "./sidebars/sidebar-header"
import { NavMain } from "./sidebars/nav-main"
import { SidebarFooterComponent } from "./sidebars/sidebar-footer"
import { SidebarFooter } from "@/components/ui/sidebar"
import { Home, Settings } from "lucide-react"

export function AppSidebar() {
  const { role, user } = useAuthStore()

  // Default sidebar for unknown or missing roles
  const renderDefaultSidebar = () => (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={[
          { title: "Dashboard", url: "/dashboard", icon: Home },
          { title: "Settings", url: "/settings", icon: Settings },
        ]} />
      </SidebarContent>
      <SidebarFooter className="border-t border-[#bfc1b7] p-4">
        <SidebarFooterComponent user={user} role={role} />
      </SidebarFooter>
    </Sidebar>
  )

  const r = (role || "").toUpperCase()

  switch (r) {
    case "DEO":
    case "ADMIN_STAFF":
      return <DeoSidebar />
    case "SCHOOL":
      return <SchoolSidebar />
    case "SCHOOL_STAFF":
    case "STAFF":
      return <StaffSidebar />
    case "CONTRACTOR":
      return <ContractorSidebar />
    default:
      return renderDefaultSidebar()
  }
}
