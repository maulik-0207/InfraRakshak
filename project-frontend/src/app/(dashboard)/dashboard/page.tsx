"use client";

import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const { role, user } = useAuthStore();

  return (
    <div className="flex flex-col gap-6 w-full px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#23251d]">
          Dash<span className="text-[#F54E00]">board</span>
        </h1>
      </div>
      
      <div className="p-8 bg-card border border-[#bfc1b7] rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-3 text-[#23251d]">Welcome back, {user?.first_name || "User"}!</h2>
        <p className="text-[#4d4f46] mb-8 leading-relaxed max-w-2xl">
          You are currently signed in as a <span className="px-2 py-0.5 bg-[#F54E00]/10 text-[#F54E00] font-bold rounded uppercase text-sm tracking-wide">{role}</span>.
        </p>

        {/* Dynamic Role Blocks */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(role === "PRINCIPAL" || role === "STAFF") && (
            <div className="p-6 bg-[#eeefe9] rounded-lg border border-[#bfc1b7] group hover:border-[#F54E00] transition-colors cursor-pointer">
              <h3 className="font-bold text-lg text-[#23251d] mb-2 group-hover:text-[#F54E00] transition-colors">School Status</h3>
              <p className="text-sm text-[#4d4f46] leading-relaxed">Submit and track infrastructure reports for your institution.</p>
            </div>
          )}

          {(role === "ADMIN" || role === "DEO") && (
            <div className="p-6 bg-[#eeefe9] rounded-lg border border-[#bfc1b7] group hover:border-[#F54E00] transition-colors cursor-pointer">
              <h3 className="font-bold text-lg text-[#23251d] mb-2 group-hover:text-[#F54E00] transition-colors">District Console</h3>
              <p className="text-sm text-[#4d4f46] leading-relaxed">Manage registrations, review bids, and oversee district compliance.</p>
            </div>
          )}

          {role === "CONTRACTOR" && (
            <div className="p-6 bg-[#eeefe9] rounded-lg border border-[#bfc1b7] group hover:border-[#F54E00] transition-colors cursor-pointer">
              <h3 className="font-bold text-lg text-[#23251d] mb-2 group-hover:text-[#F54E00] transition-colors">Project Board</h3>
              <p className="text-sm text-[#4d4f46] leading-relaxed">View assigned repair contracts and manage bidding operations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
