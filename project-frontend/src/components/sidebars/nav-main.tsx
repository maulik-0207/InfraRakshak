"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

interface NavMainProps {
  items: NavItem[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive = pathname === item.url
            return (
              <SidebarMenuItem key={item.title} className="px-4">
                <SidebarMenuButton 
                  isActive={isActive}
                  render={<Link href={item.url} />}
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
  )
}
