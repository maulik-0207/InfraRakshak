import { StaffSidebar } from "@/components/sidebars/staff-sidebar"
import { DashboardShell } from "@/components/sidebars/dashboard-shell"

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StaffSidebar />
      <DashboardShell>
        {children}
      </DashboardShell>
    </>
  )
}
