"use client";

import { useAuthStore } from "@/store/auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { User, Mail, Shield, Building, FileText } from "lucide-react";

export default function AccountPage() {
  const isMounted = useIsMounted();
  const { user, role } = useAuthStore();

  if (!isMounted) return <div className="min-h-screen" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-20">
      <div>
        <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
          Account Settings
        </h1>
        <p className="text-[#4d4f46]">
          View your profile information and system role.
        </p>
      </div>

      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-black text-[#23251d] mb-6 border-b border-[#b6b7af]/40 pb-4">
          Profile Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-[#9ea096] flex items-center gap-2">
              <Mail className="w-3 h-3" /> Email Address
            </label>
            <p className="text-lg font-bold text-[#23251d] bg-white border border-[#b6b7af] px-4 py-3 rounded-xl">
              {user?.email || "—"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-[#9ea096] flex items-center gap-2">
              <Shield className="w-3 h-3" /> System Role
            </label>
            <div className="flex">
              <span className="text-sm font-black border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 rounded-xl uppercase tracking-wider">
                {role || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 p-5 bg-blue-50 border border-blue-200 rounded-xl flex gap-4 text-blue-800">
          <Building className="w-6 h-6 shrink-0 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold mb-1">Assigned Organization</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              Your account is an administrative School Principal account. You have authority over ground staff accounts. To change UDISE mappings, please contact your District Education Officer (DEO).
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl p-8 shadow-sm flex flex-col items-center text-center">
         <FileText className="w-12 h-12 text-[#b6b7af] mb-4" />
         <h2 className="text-lg font-black text-[#23251d] mb-2">School Profile Data</h2>
         <p className="text-sm text-[#4d4f46] max-w-md">
           Looking to update your School Demographics, Area Type, or Classroom counts? You can find all school-specific configurations under your unified Dashboard.
         </p>
      </div>

    </div>
  );
}
