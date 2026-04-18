"use client";

import { useAuthStore } from "@/store/auth-store";

export default function ReportsPage() {
  const { role } = useAuthStore();

  return (
    <div className="flex flex-col gap-6 w-full px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#23251d]">
          {role === "SCHOOL" || role === "SCHOOL_STAFF" ? "My " : "District "}<span className="text-[#F54E00]">Reports</span>
        </h1>
      </div>
      
      <div className="p-8 bg-card border border-[#bfc1b7] rounded-lg shadow-sm">
         <p className="text-[#4d4f46] text-sm leading-relaxed max-w-2xl">
            {role === "SCHOOL" || role === "SCHOOL_STAFF" 
             ? "Submit new infrastructure reports or view the status of existing applications. Our system ensures your reports are prioritized for review."
             : "Browse infrastructure discrepancy reports submitted across the district. Filter by priority or category to manage district-wide repairs."}
         </p>
      </div>
    </div>
  );
}
