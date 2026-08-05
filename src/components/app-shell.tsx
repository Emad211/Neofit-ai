"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, Bell, Bot, Dumbbell, LayoutGrid, LineChart, User } from "lucide-react";
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
import { ModeToggle } from "./mode-toggle";

const navItems = [
  { href: "/today", icon: LayoutGrid, label: "امروز" },
  { href: "/workout", icon: Dumbbell, label: "تمرین" },
  { href: "/nutrition", icon: Apple, label: "تغذیه" },
  { href: "/progress", icon: LineChart, label: "پیشرفت" },
  { href: "/profile", icon: User, label: "پروفایل" },
];

function HeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" asChild aria-label="مربی نئوفیت"><Link href="/chat"><Bot className="h-5 w-5" /></Link></Button>
      <Button variant="ghost" size="icon" asChild className="relative" aria-label="اعلان‌ها">
        <Link href="/notifications"><Bell className="h-5 w-5" /><span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" /></Link>
      </Button>
      <ModeToggle />
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/today" className="flex items-center gap-2">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><Dumbbell className="h-5 w-5" /></span>
      {!compact ? <span><span className="block text-xl font-extrabold font-headline">نئوفیت</span><span className="block text-[11px] text-muted-foreground">مربی هوشمند شخصی</span></span> : <span className="font-black">NeoFit</span>}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const active = navItems.find((item) => pathname.startsWith(item.href));
  const dateLabel = new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const sidebarContent = (
    <>
      <SidebarHeader><Brand /></SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}><SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}><Link href={item.href}><item.icon /><span>{item.label}</span></Link></SidebarMenuButton></SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="mt-auto space-y-2 p-3">
          <Button asChild variant="outline" className="w-full justify-start"><Link href="/chat"><Bot className="ml-2 h-4 w-4" />مربی نئوفیت</Link></Button>
          <Button asChild variant="ghost" className="w-full justify-start"><Link href="/notifications"><Bell className="ml-2 h-4 w-4" />اعلان‌ها<span className="mr-auto rounded-full bg-destructive px-2 py-0.5 text-[10px] text-destructive-foreground">۳</span></Link></Button>
        </div>
      </SidebarContent>
    </>
  );

  if (isMobile) {
    return (
      <div dir="rtl" className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/90 px-4 py-2.5 backdrop-blur-xl"><div className="mx-auto flex max-w-3xl items-center justify-between"><Brand compact /><HeaderActions /></div></header>
        <main className="pb-28">{children}</main>
        <footer className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-xl items-center justify-around px-1 py-2" aria-label="ناوبری اصلی">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href} className={cn("flex min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs transition-colors", pathname.startsWith(item.href) ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-secondary")} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
                <item.icon className="h-5 w-5" /><span>{item.label}</span>
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
        <header dir="rtl" className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3"><SidebarTrigger asChild><Button size="icon" variant="ghost" aria-label="بازکردن منو"><LayoutGrid /></Button></SidebarTrigger><div><p className="font-black">{active?.label || "نئوفیت"}</p><p className="text-xs text-muted-foreground">{dateLabel}</p></div></div>
          <HeaderActions />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
