import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { NutritionStateProvider } from '@/components/nutrition-state';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <NutritionStateProvider>
      <AppShell>{children}</AppShell>
    </NutritionStateProvider>
  );
}
