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
            <SidebarGroupLabel className="text-lg font-bold text-[#23251d]">
              Infra<span className="text-[#F54E00]">Rakshak</span>
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="px-2">
                  <SidebarMenuButton 
                    render={<a href={item.url} />}
                    className="hover:text-[#F54E00] hover:bg-[#eeefe9] rounded-[4px] px-2 transition-all group"
                  >
                     <item.icon className="text-[#4d4f46] group-hover:text-[#F54E00] transition-colors" />
                     <span className="font-semibold">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#bfc1b7]">
         <div className="p-4 text-sm text-[#4d4f46] flex flex-col gap-1 w-full truncate bg-[#eeefe9]/50">
            <span className="font-bold text-[#23251d]">{user?.first_name} {user?.last_name}</span>
            <span className="text-xs uppercase tracking-wider text-[#F54E00] font-bold">{role}</span>
         </div>
      </SidebarFooter>
    </Sidebar>
  )
}
