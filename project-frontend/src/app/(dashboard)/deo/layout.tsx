import { DeoSidebar } from "@/components/sidebars/deo-sidebar"
import { DashboardShell } from "@/components/sidebars/dashboard-shell"

export default function DeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DeoSidebar />
      <DashboardShell>
        {children}
      </DashboardShell>
    </>
  )
}
