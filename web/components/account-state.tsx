'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface ClientAccount {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly timezone: string;
}

export interface AccountStateValue {
  readonly account: ClientAccount | null;
  readonly configured: boolean;
  readonly loadError: string | null;
}

const AccountStateContext = createContext<AccountStateValue | null>(null);

export function AccountStateProvider({
  children,
  account,
  configured,
  loadError = null,
}: {
  readonly children: ReactNode;
  readonly account: ClientAccount | null;
  readonly configured: boolean;
  readonly loadError?: string | null;
}) {
  return (
    <AccountStateContext.Provider value={{ account, configured, loadError }}>
      {children}
    </AccountStateContext.Provider>
  );
}

export function useAccountState(): AccountStateValue {
  const value = useContext(AccountStateContext);
  if (!value) throw new Error('useAccountState must be used inside AccountStateProvider');
  return value;
}

export function useOptionalAccountState(): AccountStateValue | null {
  return useContext(AccountStateContext);
}
