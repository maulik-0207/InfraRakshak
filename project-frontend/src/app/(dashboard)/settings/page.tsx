"use client";

import { useAuthStore } from "@/store/auth-store";
import { User, Mail, Shield, Building2 } from "lucide-react";

export default function SettingsPage() {
  const { user, role } = useAuthStore();

  const profileItems = [
    { icon: User, label: "Full Name", value: `${user?.first_name} ${user?.last_name}` },
    { icon: Mail, label: "Email Address", value: user?.email },
    { icon: Shield, label: "Account Role", value: role, isBadge: true },
    { icon: Building2, label: "Organization/District", value: "Western Division Branch" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#23251d]">
            Account <span className="text-[#F54E00]">Settings</span>
          </h1>
          <p className="text-[#4d4f46] mt-1 font-medium">Manage your profile and security preferences.</p>
        </div>
      </div>
      
      <div className="max-w-3xl flex flex-col gap-6">
        
        <div className="p-8 bg-card border border-[#bfc1b7] rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-[#23251d] mb-6 border-b border-[#eeefe9] pb-4 uppercase tracking-wider text-xs">Profile Information</h2>
          <div className="grid gap-8">
            {profileItems.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-12">
                <div className="flex items-center gap-3 w-48 shrink-0">
                  <div className="h-8 w-8 rounded bg-[#eeefe9] flex items-center justify-center text-[#4d4f46]">
                    <item.icon size={16} />
                  </div>
                  <span className="text-[13px] font-bold text-[#65675e] uppercase tracking-wide">{item.label}</span>
                </div>
                {item.isBadge ? (
                  <span className="inline-flex px-2.5 py-1 bg-[#F54E00]/10 text-[#F54E00] text-[11px] font-extrabold rounded uppercase tracking-widest border border-[#F54E00]/20">
                    {item.value}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-[#23251d] truncate">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-[#eeefe9]/30 border border-dashed border-[#bfc1b7] rounded-lg">
           <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-white border border-[#bfc1b7] rounded-full flex items-center justify-center text-[#9ea096] shrink-0">
                <Shield size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-[#23251d] uppercase tracking-wide text-xs">Security & Support</h3>
                <p className="text-sm text-[#4d4f46] leading-relaxed">
                  Authentication is managed via the **District Identity Service**. If you need to change your password or update your official credentials, please contact the system administrator.
                </p>
                <div className="flex gap-4 mt-4">
                   <button className="text-xs font-bold text-[#F54E00] hover:underline uppercase tracking-widest">Update Credentials</button>
                   <button className="text-xs font-bold text-[#F54E00] hover:underline uppercase tracking-widest">Contact IT</button>
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
