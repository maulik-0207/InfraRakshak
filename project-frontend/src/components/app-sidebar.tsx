"use client"

import { Calendar, Home, Inbox, Search, Settings, ClipboardCheck, User, LogOut, Gavel } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useAuthStore } from "@/store/auth-store"
import { DeoSidebar } from "./sidebars/deo-sidebar"
import { SchoolSidebar } from "./sidebars/school-sidebar"
import { StaffSidebar } from "./sidebars/staff-sidebar"
import { ContractorSidebar } from "./sidebars/contractor-sidebar"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { SidebarHeader } from "./sidebars/sidebar-header"
import { SidebarFooterComponent } from "./sidebars/sidebar-footer"

export function AppSidebar() {
  const { role, user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    // Clear cookies
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    logout();
    router.push("/login");
  }

  // Default sidebar for unknown or missing roles (using polished remote UI)
  const renderDefaultSidebar = () => {
    const navItems = [
      { title: "Dashboard", url: "/dashboard", icon: Home },
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
           <SidebarFooterComponent user={user} role={role} />
        </SidebarFooter>
      </Sidebar>
    )
  }

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
 