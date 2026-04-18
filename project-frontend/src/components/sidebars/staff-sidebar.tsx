"use client"

import { Home, Calendar, User, Settings } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar"
import { SidebarHeader } from "./sidebar-header"
import { SidebarFooterComponent } from "./sidebar-footer"
import { useAuthStore } from "@/store/auth-store"
import { useIsMounted } from "@/hooks/use-is-mounted"
import { NavMain } from "./nav-main"

export function StaffSidebar() {
  const isMounted = useIsMounted()
  const { user, role } = useAuthStore()

  if (!isMounted) return null
  const navItems = [
    { title: "Dashboard", url: "/staff/dashboard", icon: Home },
    { title: "Weekly Reports", url: "/staff/reports", icon: Calendar },
    { title: "Account", url: "/staff/account", icon: User },
    { title: "Settings", url: "/settings", icon: Settings },
  ]

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-[#bfc1b7] p-4">
        <SidebarFooterComponent user={user} role={role} />
      </SidebarFooter>
    </Sidebar>
  )
}
