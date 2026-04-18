"use client"

import { Calendar, Home, Inbox, Search, Settings, ClipboardCheck, User, LogOut, Gavel } from "lucide-react"
import Image from "next/image"

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
import { useAuthStore } from "@/store/auth-store"
import { useRouter, usePathname } from "next/navigation"

export function AppSidebar() {
  const { role, user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    // Clear cookies
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    logout();
    router.push("/login");
  }

  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    ...(role === "CONTRACTOR" 
      ? [{ title: "My Bids", url: "/my-contracts", icon: Gavel }] 
      : [{ title: "Reports", url: "/reports", icon: Inbox }]),
    { title: "Contracts", url: "/contracts", icon: ClipboardCheck },
    { title: "Settings", url: "/settings", icon: Settings },
  ]

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <Image
              src="/logo.png"
              alt="InfraRakshak Logo"
              width={150}
              height={0}
              style={{ height: "auto" }}
              className="object-contain"
              priority
            />
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title} className="px-4">
                    <SidebarMenuButton 
                      isActive={isActive}
                      render={<a href={item.url} />}
                      className={`h-11 px-3 transition-all group flex items-center gap-3 rounded-[6px] 
                        ${isActive 
                          ? "bg-[#F54E00] text-white shadow-[0_2px_0_0_#b17816]" 
                          : "hover:text-[#F54E00] hover:bg-[#eeefe9] text-[#4d4f46]"
                        }`}
                    >
                       <item.icon className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-[#4d4f46] group-hover:text-[#F54E00]"}`} />
                       <span className={`font-bold tracking-tight ${isActive ? "text-white" : ""}`}>
                         {item.title}
                       </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#bfc1b7] p-4">
         <div className="p-4 text-sm text-[#4d4f46] flex flex-col gap-4 w-full bg-[#eeefe9]/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded bg-[#1e1f23] flex items-center justify-center text-white shrink-0">
                <User size={20} />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-bold text-[#23251d] truncate">{user?.first_name} {user?.last_name}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#F54E00] font-bold">{role}</span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-bold text-[#4d4f46] hover:text-[#F54E00] hover:bg-[#fdfdf8] rounded border border-[#bfc1b7] transition-all group"
            >
              <LogOut size={14} className="group-hover:text-[#F54E00]" />
              Sign Out
            </button>
         </div>
      </SidebarFooter>
    </Sidebar>
  )
}
