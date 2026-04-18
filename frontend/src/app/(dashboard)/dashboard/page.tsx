"use client";

import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const { role, user } = useAuthStore();

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
      </div>
      
      <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h2 className="text-xl font-medium mb-2">Welcome, {user?.first_name || "User"}</h2>
        <p className="text-muted-foreground mb-6">
          You are currently viewing the system as a <span className="font-bold text-primary">{role}</span>.
        </p>

        {/* Dynamic Role Blocks */}
        {role === "PRINCIPAL" && (
          <div className="p-4 bg-secondary/30 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-2">School Status Overview</h3>
            <p className="text-sm text-muted-foreground">Your recent reports and school compliance metrics will appear here.</p>
          </div>
        )}

        {(role === "ADMIN" || role === "DEO") && (
          <div className="p-4 bg-secondary/30 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-2">District Command Center</h3>
            <p className="text-sm text-muted-foreground">Approve new school registrations, review contractor bids, and view system-wide analytics.</p>
          </div>
        )}

        {role === "CONTRACTOR" && (
          <div className="p-4 bg-secondary/30 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-2">Bids & Assignments</h3>
            <p className="text-sm text-muted-foreground">Review incoming reports and track active repair contracts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
