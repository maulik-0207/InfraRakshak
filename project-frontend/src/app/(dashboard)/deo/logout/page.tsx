"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Call the internal logout API to clear server-side cookies
        await fetch("/api/auth/logout", { method: "POST" });
        
        // Clear client-side store
        logout();
        
        // Redirect to login
        router.push("/login");
      } catch (error) {
        console.error("Logout failed:", error);
        // Fallback: clear client state and redirect anyway
        logout();
        router.push("/login");
      }
    };

    handleLogout();
  }, [logout, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f9fa]">
      <div className="p-12 bg-white rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 border border-slate-100">
         <Loader2 size={48} className="text-orange-600 animate-spin" />
         <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Signing you out</h2>
            <p className="text-slate-400 font-medium mt-1">Safely clearing your session and credentials...</p>
         </div>
      </div>
    </div>
  );
}
