"use client"

import { Home, ClipboardCheck, ShieldCheck, School, Calendar, Inbox, User, Settings } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar"
import { SidebarHeader } from "./sidebar-header"
import { SidebarFooterComponent } from "./sidebar-footer"
import { useAuthStore } from "@/store/auth-store"
import { useIsMounted } from "@/hooks/use-is-mounted"
import { NavMain } from "./nav-main"

export function DeoSidebar() {
  const isMounted = useIsMounted()
  const { user, role } = useAuthStore()

  if (!isMounted) return null
  const navItems = [
    { title: "Dashboard", url: "/deo/dashboard", icon: Home },
    { title: "Contracts", url: "/deo/contracts", icon: ClipboardCheck },
    { title: "Admin Staff", url: "/deo/admin-staff", icon: ShieldCheck },
    { title: "Contractors", url: "/deo/contractors", icon: ClipboardCheck },
    { title: "Schools", url: "/deo/schools", icon: School },
    { title: "Reports", url: "/deo/reports", icon: Calendar },
    { title: "Notifications", url: "/deo/notifications", icon: Inbox },
    { title: "Account", url: "/deo/account", icon: User },
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
