'use client';

import * as React from 'react';
import { Check, Crown, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/provider';
import { useSubscription } from '@/context/subscription-context';
import { PLAN_DEFINITIONS, PlanId } from '@/lib/subscriptions';
import { BillingClientError, purchasePlan, restorePurchases } from '@/lib/billing-client';

const order: PlanId[] = ['free', 'plus', 'pro'];

export default function PricingPage() {
  const { locale, t } = useI18n();
  const subscription = useSubscription();
  const { toast } = useToast();
  const [pending, setPending] = React.useState<PlanId | 'restore' | null>(null);

  const formatPrice = (amount: number) => new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(amount);

  const buy = async (planId: Exclude<PlanId, 'free'>) => {
    setPending(planId);
    try {
      await purchasePlan(planId);
      toast({
        title: locale === 'fa' ? 'عضویت فعال شد' : 'Membership activated',
        description: locale === 'fa' ? 'خرید شما توسط فروشگاه تأیید شد.' : 'Your purchase was verified by the store.',
      });
    } catch (error) {
      const unavailable = error instanceof BillingClientError && error.status === 501;
      toast({
        variant: 'destructive',
        title: unavailable
          ? (locale === 'fa' ? 'نسخه فروشگاهی لازم است' : 'Store build required')
          : (locale === 'fa' ? 'خرید تأیید نشد' : 'Purchase was not verified'),
        description: unavailable
          ? (locale === 'fa' ? 'خرید درون‌برنامه‌ای پس از بسته‌بندی نسخه مخصوص Google Play، بازار یا مایکت فعال می‌شود.' : 'In-app billing becomes available in the Google Play, Bazaar, or Myket packaged build.')
          : (error instanceof Error ? error.message : t('common.error')),
      });
    } finally {
      setPending(null);
    }
  };

  const restore = async () => {
    setPending('restore');
    try {
      await restorePurchases();
      toast({ title: locale === 'fa' ? 'خریدها بازیابی شدند' : 'Purchases restored' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: locale === 'fa' ? 'بازیابی انجام نشد' : 'Restore failed',
        description: error instanceof Error ? error.message : t('common.error'),
      });
    } finally {
      setPending(null);
    }
  };

  const featureRows = (planId: PlanId) => {
    const plan = PLAN_DEFINITIONS[planId];
    return [
      t('plans.aiRequests', { count: plan.aiRequestsPerDay }),
      t('plans.planGenerations', { count: plan.planGenerationsPerMonth }),
      t('plans.foodScans', { count: plan.foodScansPerDay }),
      ...(plan.weeklyAdaptation ? [t('plans.weeklyAdaptation')] : []),
      ...(plan.advancedReports ? [t('plans.advancedReports')] : []),
      ...(plan.priorityModels ? [t('plans.priorityModels')] : []),
    ];
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-10 max-w-3xl text-center">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-5xl">{t('plans.title')}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t('plans.subtitle')}</p>
        </header>

        <Alert className="mb-8">
          <AlertDescription>{t('plans.billingNotice')}</AlertDescription>
        </Alert>

        <section className="grid gap-6 lg:grid-cols-3">
          {order.map((planId) => {
            const plan = PLAN_DEFINITIONS[planId];
            const current = subscription.planId === planId;
            const emphasized = planId === 'plus';
            return (
              <Card key={planId} className={emphasized ? 'relative border-primary shadow-lg' : 'relative'}>
                {emphasized && (
                  <Badge className="absolute -top-3 start-1/2 -translate-x-1/2">
                    {locale === 'fa' ? 'پیشنهاد متعادل' : 'Best balance'}
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      {planId === 'pro' && <Crown className="h-5 w-5" aria-hidden="true" />}
                      {t(`plans.${planId}`)}
                    </CardTitle>
                    {current && <Badge variant="secondary">{t('plans.current')}</Badge>}
                  </div>
                  <CardDescription>
                    {plan.monthlyPriceIrt === 0 ? (
                      <span className="text-3xl font-bold text-foreground">{locale === 'fa' ? 'رایگان' : 'Free'}</span>
                    ) : (
                      <span className="text-foreground">
                        <span className="text-3xl font-bold">{formatPrice(plan.monthlyPriceIrt)}</span>{' '}
                        <span>{locale === 'fa' ? 'تومان' : 'IRT'} / {t('plans.month')}</span>
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {featureRows(planId).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {planId === 'free' ? (
                    <Button className="w-full" variant="outline" disabled>{current ? t('plans.current') : t('plans.free')}</Button>
                  ) : (
                    <Button className="w-full" disabled={current || pending !== null} onClick={() => void buy(planId)}>
                      {pending === planId && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                      {current ? t('plans.current') : t('common.upgrade')}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </section>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => void restore()} disabled={pending !== null}>
            {pending === 'restore' ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
            {locale === 'fa' ? 'بازیابی خریدهای قبلی' : 'Restore previous purchases'}
          </Button>
        </div>
      </div>
    </main>
  );
}
