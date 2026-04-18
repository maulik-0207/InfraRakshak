import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full h-full flex flex-col p-4 md:p-8 overflow-y-auto">
        <header className="flex w-full min-h-12 items-center lg:hidden">
            <SidebarTrigger />
        </header>
        {children}
      </main>
    </SidebarProvider>
  )
}
