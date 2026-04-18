"use client";

import { useAuthStore } from "@/store/auth-store";

export default function ReportsPage() {
  const { role } = useAuthStore();

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {role === "PRINCIPAL" ? "My Reports" : "District Reports"}
        </h1>
      </div>
      
      <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
         <p className="text-muted-foreground text-sm">
            {role === "PRINCIPAL" 
             ? "Submit new infrastructure reports or view the status of existing applications."
             : "Browse infrastructure discrepancy reports submitted across the district."}
         </p>
      </div>
    </div>
  );
}
