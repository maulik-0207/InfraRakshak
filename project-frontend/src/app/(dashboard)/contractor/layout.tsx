import { ContractorSidebar } from "@/components/sidebars/contractor-sidebar"
import { DashboardShell } from "@/components/sidebars/dashboard-shell"

export default function ContractorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ContractorSidebar />
      <DashboardShell>
        {children}
      </DashboardShell>
    </>
  )
}
