import type { ReactNode } from 'react';
import { AccountStateProvider } from '@/components/account-state';
import { AppShell } from '@/components/app-shell';
import { loadAccountIdentity } from '@/lib/supabase/account';

export default async function MainLayout({ children }: { children: ReactNode }) {
  const identity = await loadAccountIdentity();

  return (
    <AccountStateProvider
      account={identity.account}
      configured={identity.configured}
      loadError={identity.loadError}
    >
      <AppShell>{children}</AppShell>
    </AccountStateProvider>
  );
}
