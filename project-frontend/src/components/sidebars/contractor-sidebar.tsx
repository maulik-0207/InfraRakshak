"use client"

import { Home, Gavel, ClipboardCheck, Inbox, User, Settings } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar"
import { SidebarHeader } from "./sidebar-header"
import { SidebarFooterComponent } from "./sidebar-footer"
import { useAuthStore } from "@/store/auth-store"
import { useIsMounted } from "@/hooks/use-is-mounted"
import { NavMain } from "./nav-main"

export function ContractorSidebar() {
  const isMounted = useIsMounted()
  const { user, role } = useAuthStore()

  if (!isMounted) return null
  const navItems = [
    { title: "Dashboard", url: "/contractor/dashboard", icon: Home },
    { title: "Account", url: "/contractor/account", icon: User },
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
