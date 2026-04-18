"use client";

import { useAuthStore } from "@/store/auth-store";

export default function ContractsPage() {
  const { role } = useAuthStore();

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Contracts & Bidding
        </h1>
      </div>
      
      <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
         <p className="text-muted-foreground text-sm">
            {role === "ADMIN" || role === "DEO" 
             ? "Manage contractor assignments and approve bids."
             : role === "CONTRACTOR" 
               ? "View your assigned repair contracts and submit bids." 
               : "View active contracts assigned to your school."}
         </p>
      </div>
    </div>
  );
}
