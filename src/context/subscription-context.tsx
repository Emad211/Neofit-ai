'use client';

import * as React from 'react';
import { doc, getFirestore, onSnapshot, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useUserData } from '@/context/user-profile-context';
import { getPlanDefinition, PlanDefinition, PlanId } from '@/lib/subscriptions';

const db = getFirestore(app);

type SubscriptionState = {
  planId: PlanId;
  status: 'active' | 'inactive' | 'past_due' | 'cancelled';
  provider: string | null;
  activeUntil: Date | null;
};

type SubscriptionContextValue = SubscriptionState & {
  plan: PlanDefinition;
  isLoading: boolean;
  has: (feature: keyof Pick<PlanDefinition, 'weeklyAdaptation' | 'advancedReports' | 'priorityModels'>) => boolean;
};

const defaultState: SubscriptionState = {
  planId: 'free',
  status: 'active',
  provider: 'internal',
  activeUntil: null,
};

const SubscriptionContext = React.createContext<SubscriptionContextValue | null>(null);

function isPlanId(value: unknown): value is PlanId {
  return value === 'free' || value === 'plus' || value === 'pro';
}

function toDate(value: unknown) {
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate() as Date;
  }
  return null;
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUserData();
  const [state, setState] = React.useState<SubscriptionState>(defaultState);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setState(defaultState);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    return onSnapshot(doc(db, 'subscriptions', user.uid), (snapshot) => {
      const data = snapshot.data();
      const activeUntil = toDate(data?.activeUntil);
      const currentlyActive = data?.status === 'active' && (!activeUntil || activeUntil.getTime() > Date.now());
      setState({
        planId: currentlyActive && isPlanId(data?.planId) ? data.planId : 'free',
        status: currentlyActive ? 'active' : (data?.status || 'inactive'),
        provider: typeof data?.provider === 'string' ? data.provider : null,
        activeUntil,
      });
      setIsLoading(false);
    }, (error) => {
      console.error('Subscription listener failed:', error);
      setState(defaultState);
      setIsLoading(false);
    });
  }, [user]);

  const plan = React.useMemo(() => getPlanDefinition(state.planId), [state.planId]);
  const has = React.useCallback((feature: keyof Pick<PlanDefinition, 'weeklyAdaptation' | 'advancedReports' | 'priorityModels'>) => Boolean(plan[feature]), [plan]);
  const value = React.useMemo(() => ({ ...state, plan, isLoading, has }), [state, plan, isLoading, has]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = React.useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider.');
  return context;
}
