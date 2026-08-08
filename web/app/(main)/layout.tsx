import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { NutritionStateProvider } from '@/components/nutrition-state';
import { loadAccountSnapshot } from '@/lib/supabase/account';

export default async function MainLayout({ children }: { children: ReactNode }) {
  const snapshot = await loadAccountSnapshot();

  return (
    <NutritionStateProvider
      account={snapshot.account}
      configured={snapshot.configured}
      initialDiary={snapshot.diary}
      initialGoals={snapshot.goals}
      loadError={snapshot.loadError}
    >
      <AppShell>{children}</AppShell>
    </NutritionStateProvider>
  );
}
