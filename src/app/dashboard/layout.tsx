import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="print:block">
      <DashboardSidebar />
      <SidebarInset className="print:block print:min-h-0 print:bg-white">
        <DashboardHeader />
        <main className="p-4 lg:p-6 print:p-0 print:m-0 print:overflow-visible">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}