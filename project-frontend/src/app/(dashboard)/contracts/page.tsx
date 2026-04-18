"use client";

import { useAuthStore } from "@/store/auth-store";

export default function ContractsPage() {
  const { role } = useAuthStore();

  return (
    <div className="flex flex-col gap-6 w-full px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#23251d]">
          Contracts & <span className="text-[#F54E00]">Bidding</span>
        </h1>
      </div>
      
      <div className="p-8 bg-card border border-[#bfc1b7] rounded-lg shadow-sm">
         <p className="text-[#4d4f46] text-sm leading-relaxed max-w-2xl">
            {role === "ADMIN" || role === "DEO" 
             ? "Manage contractor assignments and approve bids. Oversee the entire procurement lifecycle from this interface."
             : role === "CONTRACTOR" 
               ? "View your assigned repair contracts and submit bids for new infrastructure projects." 
               : "View active contracts assigned to your school and track repair timelines."}
         </p>
      </div>
    </div>
  );
}
