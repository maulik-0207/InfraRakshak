"use client"

import { Calendar, Home, Inbox, Search, Settings, ShieldCheck, ClipboardCheck } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuthStore } from "@/store/auth-store"

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Reports", url: "/reports", icon: Inbox },
  { title: "Contracts", url: "/contracts", icon: ClipboardCheck },
]

export function AppSidebar() {
  const { role, user } = useAuthStore()

  // Items are identical structurally now, data filters dynamically downstream on the pages.
  let items = navItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between p-4 pb-2">
            <SidebarGroupLabel className="text-lg font-bold text-foreground">
              InfraRakshak
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<a href={item.url} />}>
                     <item.icon />
                     <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
         <div className="p-4 text-sm text-muted-foreground flex flex-col gap-1 w-full truncate">
            <span className="font-medium text-foreground">{user?.first_name} {user?.last_name}</span>
            <span className="text-xs">{role}</span>
         </div>
      </SidebarFooter>
    </Sidebar>
  )
}
