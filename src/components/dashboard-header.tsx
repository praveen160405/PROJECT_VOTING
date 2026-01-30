import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { ConnectWalletButton } from "./connect-wallet-button";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* Can add breadcrumbs or page title here */}
      </div>
      <ConnectWalletButton />
      <ThemeToggle />
    </header>
  );
}
