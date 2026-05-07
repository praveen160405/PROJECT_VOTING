'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Vote,
  BarChart,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  BarChart3,
  ShieldCheck,
  Scale,
  Eye,
  FileText,
} from "lucide-react";
import { Logo } from "./logo";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Voter } from "@/lib/types";


export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, user, firestore } = useFirebase();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<Voter>(userDocRef);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/login');
  };

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/vote", label: "Vote", icon: Vote },
    { href: "/dashboard/verify", label: "Verify Integrity", icon: ShieldCheck },
    { href: "/dashboard/results", label: "Results", icon: BarChart },
    { href: "/dashboard/insights", label: "Insights", icon: BarChart3 },
    { href: "/dashboard/deepfake-detection", label: "AI Integrity Lab", icon: Eye },
    { href: "/dashboard/transparency-report", label: "Transparency Report", icon: FileText },
    { href: "/dashboard/compliance", label: "Compliance", icon: Scale },
  ];

  return (
    <Sidebar className="print:hidden">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label }}
                  suppressHydrationWarning
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          {userProfile?.isAdmin && (
            <SidebarMenuItem>
              <Link href="/dashboard/admin">
                <SidebarMenuButton
                  isActive={pathname.startsWith("/dashboard/admin")}
                  tooltip={{ children: "Admin" }}
                  suppressHydrationWarning
                >
                  <Shield />
                  <span>Admin Panel</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
              <Link href="/dashboard/settings">
                <SidebarMenuButton
                  isActive={pathname === "/dashboard/settings"}
                  tooltip={{ children: "Settings" }}
                  suppressHydrationWarning
                >
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <SidebarMenuButton onClick={handleLogout} tooltip={{children: "Logout"}} suppressHydrationWarning>
                <LogOut />
                <span>Logout</span>
             </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}