"use client"

import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { useIsMounted } from "@/hooks/use-is-mounted"

interface SidebarFooterProps {
  user: any;
  role: string | null;
}

export function SidebarFooterComponent({ user, role }: SidebarFooterProps) {
  const isMounted = useIsMounted()
  const { logout } = useAuthStore()
  const router = useRouter()

  if (!isMounted) return null;

  const handleLogout = () => {
    // Clear cookies
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    logout();
    router.push("/login");
  }

  return (
    <div className="p-4 text-sm text-[#4d4f46] flex flex-col gap-4 w-full bg-[#eeefe9]/50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded bg-[#1e1f23] flex items-center justify-center text-white shrink-0">
          <User size={20} />
        </div>
        <div className="flex flex-col truncate">
          <span className="font-bold text-[#23251d] truncate">
            {user?.first_name} {user?.last_name}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#F54E00] font-bold">
            {role}
          </span>
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
  )
}
