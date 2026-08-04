"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, Dumbbell, LayoutGrid, LineChart, User } from "lucide-react";
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
import type { ReactNode } from "react";
import { ModeToggle } from "./mode-toggle";

const navItems = [
  { href: "/today", icon: LayoutGrid, label: "امروز" },
  { href: "/nutrition", icon: Apple, label: "تغذیه" },
  { href: "/workout", icon: Dumbbell, label: "تمرین" },
  { href: "/progress", icon: LineChart, label: "پیشرفت" },
  { href: "/profile", icon: User, label: "پروفایل" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const sidebarContent = (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-3">
          <Link href="/today" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-extrabold font-headline">نئوفیت</span>
              <span className="block text-[11px] text-muted-foreground">مربی هوشمند شخصی</span>
            </span>
          </Link>
          <ModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
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
      <div dir="rtl" className="min-h-screen bg-background">
        <main className="pb-24">{children}</main>
        <footer className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/90 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-xl items-center justify-around px-1 py-2">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className={cn(
                  "flex min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs transition-colors",
                  pathname.startsWith(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-5 w-5" />
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
      <Sidebar side="right" collapsible="icon">{sidebarContent}</Sidebar>
      <SidebarInset>
        <div className="absolute right-4 top-4 z-20">
          <SidebarTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="بازکردن منو"><LayoutGrid /></Button>
          </SidebarTrigger>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
