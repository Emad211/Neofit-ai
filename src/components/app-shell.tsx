"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, Bell, Bot, Dumbbell, LayoutGrid, LineChart, User, WifiOff } from "lucide-react";
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
import { useNotifications } from "@/hooks/use-notifications";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { ModeToggle } from "./mode-toggle";

const navItems = [
  { href: "/today", icon: LayoutGrid, label: "امروز" },
  { href: "/workout", icon: Dumbbell, label: "تمرین" },
  { href: "/nutrition", icon: Apple, label: "تغذیه" },
  { href: "/progress", icon: LineChart, label: "پیشرفت" },
  { href: "/profile", icon: User, label: "پروفایل" },
];

function HeaderActions({ unreadCount }: { unreadCount: number }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" asChild aria-label="مربی نئوفیت"><Link href="/chat"><Bot className="h-5 w-5" /></Link></Button>
      <Button variant="ghost" size="icon" asChild className="relative" aria-label={`اعلان‌ها${unreadCount ? `، ${unreadCount.toLocaleString("fa-IR")} خوانده‌نشده` : ""}`}>
        <Link href="/notifications"><Bell className="h-5 w-5" />{unreadCount ? <span className="absolute left-1 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground ring-2 ring-background">{unreadCount.toLocaleString("fa-IR")}</span> : null}</Link>
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

function OfflineBanner() {
  return (
    <div dir="rtl" role="status" className="flex items-center justify-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-900 dark:text-amber-100">
      <WifiOff className="h-4 w-4" />
      آفلاین هستی؛ ثبت‌های محلی ادامه دارند و همگام‌سازی بعد از اتصال انجام می‌شود.
      <Link href="/offline" className="underline underline-offset-4">جزئیات</Link>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const { isOnline, isHydrated: connectionHydrated } = useOnlineStatus();
  const active = navItems.find((item) => pathname.startsWith(item.href));
  const dateLabel = new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const showOffline = connectionHydrated && !isOnline;

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
          <Button asChild variant="ghost" className="w-full justify-start"><Link href="/notifications"><Bell className="ml-2 h-4 w-4" />اعلان‌ها{unreadCount ? <span className="mr-auto rounded-full bg-destructive px-2 py-0.5 text-[10px] text-destructive-foreground">{unreadCount.toLocaleString("fa-IR")}</span> : null}</Link></Button>
        </div>
      </SidebarContent>
    </>
  );

  if (isMobile) {
    return (
      <div dir="rtl" className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/90 px-4 py-2.5 backdrop-blur-xl"><div className="mx-auto flex max-w-3xl items-center justify-between"><Brand compact /><HeaderActions unreadCount={unreadCount} /></div></header>
        {showOffline ? <OfflineBanner /> : null}
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
          <div className="flex items-center gap-3"><SidebarTrigger aria-label="بازکردن منو" className="h-9 w-9"><LayoutGrid className="h-5 w-5" /></SidebarTrigger><div><p className="font-black">{active?.label || "نئوفیت"}</p><p className="text-xs text-muted-foreground">{dateLabel}</p></div></div>
          <HeaderActions unreadCount={unreadCount} />
        </header>
        {showOffline ? <OfflineBanner /> : null}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
