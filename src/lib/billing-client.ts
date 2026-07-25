'use client';

import { getAuth } from 'firebase/auth';
import type { PlanId } from '@/lib/subscriptions';
import { app } from '@/lib/firebase';

export type BillingProvider = 'google_play' | 'cafebazaar' | 'myket';

export type NativePurchaseResult = {
  provider: BillingProvider;
  productId: string;
  purchaseToken: string;
  packageName: string;
  orderId?: string;
};

declare global {
  interface Window {
    NeoFitBilling?: {
      purchase: (planId: Exclude<PlanId, 'free'>) => Promise<NativePurchaseResult>;
      restore?: () => Promise<NativePurchaseResult[]>;
    };
  }
}

export class BillingClientError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = 'BillingClientError';
  }
}

async function verifyPurchase(purchase: NativePurchaseResult) {
  const user = getAuth(app).currentUser;
  if (!user) throw new BillingClientError('Authentication required.', 401);
  const token = await user.getIdToken();
  const response = await fetch('/api/billing/verify', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(purchase),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null) as { error?: string; planId?: PlanId } | null;
  if (!response.ok || !payload?.planId) {
    throw new BillingClientError(payload?.error || 'Purchase verification failed.', response.status);
  }
  return payload.planId;
}

export async function purchasePlan(planId: Exclude<PlanId, 'free'>) {
  if (!window.NeoFitBilling?.purchase) {
    throw new BillingClientError('Store billing is not available in this build.', 501);
  }
  const purchase = await window.NeoFitBilling.purchase(planId);
  return verifyPurchase(purchase);
}

export async function restorePurchases() {
  if (!window.NeoFitBilling?.restore) {
    throw new BillingClientError('Purchase restoration is not available in this build.', 501);
  }
  const purchases = await window.NeoFitBilling.restore();
  const verified: PlanId[] = [];
  for (const purchase of purchases) verified.push(await verifyPurchase(purchase));
  return verified;
}
