"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Apple,
  Dumbbell,
  LineChart,
  User,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReactNode } from "react";
import { ModeToggle } from "./mode-toggle";

const navItems = [
  { href: "/today", icon: LayoutGrid, label: "Today" },
  { href: "/nutrition", icon: Apple, label: "Nutrition" },
  { href: "/workout", icon: Dumbbell, label: "Workout" },
  { href: "/progress", icon: LineChart, label: "Progress" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const sidebarContent = (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Link href="/today" className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-headline">NeoFit AI</span>
          </Link>
          <ModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );

  if (isMobile) {
    return (
      <div>
        <main className="pb-20">{children}</main>
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/80 backdrop-blur-sm">
          <nav className="flex items-center justify-around p-2">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs transition-colors hover:bg-secondary",
                  pathname.startsWith(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </footer>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        {sidebarContent}
      </Sidebar>
      <SidebarInset>
        <div className="absolute top-4 left-4">
          <SidebarTrigger asChild>
            <Button size="icon" variant="ghost"><LayoutGrid /></Button>
          </SidebarTrigger>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
