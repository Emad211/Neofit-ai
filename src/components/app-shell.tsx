'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Apple, Crown, Dumbbell, LayoutGrid, LineChart, Menu, User } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/i18n/provider';
import { useSubscription } from '@/context/subscription-context';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { direction, t } = useI18n();
  const { planId } = useSubscription();
  const navItems = [
    { href: '/today', icon: LayoutGrid, label: t('nav.today') },
    { href: '/nutrition', icon: Apple, label: t('nav.nutrition') },
    { href: '/workout', icon: Dumbbell, label: t('nav.workout') },
    { href: '/progress', icon: LineChart, label: t('nav.progress') },
    { href: '/profile', icon: User, label: t('nav.profile') },
  ];

  const sidebarContent = (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <Link href="/today" className="flex min-w-0 items-center gap-2">
            <Dumbbell className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate font-headline text-xl font-bold">{t('common.appName')}</span>
          </Link>
          <ModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                  <Link href={item.href} aria-current={active ? 'page' : undefined}>
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/pricing')} tooltip={t('nav.plans')}>
              <Link href="/pricing" aria-current={pathname.startsWith('/pricing') ? 'page' : undefined}>
                <Crown aria-hidden="true" />
                <span>{t('nav.plans')}</span>
                <Badge variant="secondary" className="ms-auto uppercase">{planId}</Badge>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <LanguageSwitcher />
      </SidebarFooter>
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen">
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-card/90 px-4 backdrop-blur-sm">
          <Link href="/today" className="flex items-center gap-2 font-headline font-bold">
            <Dumbbell className="h-6 w-6 text-primary" aria-hidden="true" />
            <span>{t('common.appName')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </header>
        <main className="pb-[calc(5rem+env(safe-area-inset-bottom))] pt-14">{children}</main>
        <footer className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
          <nav className="grid grid-cols-5 px-1 py-1" aria-label={t('common.appName')}>
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] transition-colors hover:bg-secondary',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </footer>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side={direction === 'rtl' ? 'right' : 'left'} collapsible="icon">
        {sidebarContent}
      </Sidebar>
      <SidebarInset>
        <div className="absolute start-4 top-4 z-20">
          <SidebarTrigger asChild>
            <Button size="icon" variant="ghost" aria-label={direction === 'rtl' ? 'باز و بسته کردن منو' : 'Toggle navigation'}>
              <Menu aria-hidden="true" />
            </Button>
          </SidebarTrigger>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
