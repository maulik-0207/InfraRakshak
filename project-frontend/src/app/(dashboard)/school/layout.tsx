import { SchoolSidebar } from "@/components/sidebars/school-sidebar"
import { DashboardShell } from "@/components/sidebars/dashboard-shell"

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchoolSidebar />
      <DashboardShell>
        {children}
      </DashboardShell>
    </>
  )
}
