'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Search, Wheat } from 'lucide-react';
import { foodLookup } from '@/ai/flows/food-lookup';
import type { FoodLookupOutput } from '@/ai/schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useUserData } from '@/context/user-profile-context';
import { useI18n } from '@/i18n/provider';
import { AiClientError } from '@/lib/ai-client';

const searchSchema = z.object({ query: z.string().trim().min(2).max(300) });
type SearchValues = z.infer<typeof searchSchema>;

function NutrientDisplay({ label, value, unit }: { label: string; value: number; unit: string }) {
  return <div className="rounded-lg bg-secondary p-3 text-center"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold text-primary">{Math.round(value)}<span className="ms-1 text-sm text-primary/80">{unit}</span></p></div>;
}

export function FoodLibrary() {
  const [result, setResult] = React.useState<FoodLookupOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useUserData();
  const { locale, t } = useI18n();
  const form = useForm<SearchValues>({ resolver: zodResolver(searchSchema), defaultValues: { query: '' } });

  const search = async (values: SearchValues) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await foodLookup({ foodName: values.query, locale }));
    } catch (caught) {
      console.error('Food lookup failed:', caught);
      setError(caught instanceof AiClientError && caught.status === 429
        ? (locale === 'fa' ? 'سهمیه درخواست‌های امروز تمام شده است.' : 'Today’s AI request limit has been reached.')
        : (locale === 'fa' ? 'اطلاعات قابل‌اعتمادی برای این عبارت پیدا نشد. مقدار و واحد را دقیق‌تر بنویسید.' : 'No reliable estimate was produced. Include a clearer quantity and unit.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Alert className="mb-5"><AlertDescription>{t('nutrition.estimateWarning')}</AlertDescription></Alert>
      <form onSubmit={form.handleSubmit(search)} className="mb-8 flex items-start gap-2">
        <div className="flex-1">
          <Input {...form.register('query')} placeholder={locale === 'fa' ? 'مثلاً ۱۰۰ گرم ماست یونانی کم‌چرب' : 'For example: 100 g low-fat Greek yogurt'} className="text-base" />
          {form.formState.errors.query && <p className="mt-1 text-sm text-destructive">{locale === 'fa' ? 'نام غذا و مقدار را دقیق‌تر وارد کنید.' : 'Enter a more specific food and quantity.'}</p>}
        </div>
        <Button type="submit" size="icon" disabled={isLoading} aria-label={t('nutrition.foodLibrary')}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </Button>
      </form>

      {isLoading && <Card><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></CardHeader><CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 w-full" />)}</CardContent></Card>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {result && (
        <Card className="animate-in fade-in-50">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle className="font-headline text-2xl">{result.itemName}</CardTitle><p className="text-muted-foreground">{locale === 'fa' ? 'اندازه سهم' : 'Serving'}: {result.servingSize}</p></div>
              <Badge variant="secondary">{locale === 'fa' ? `اطمینان: ${result.confidence === 'high' ? 'زیاد' : result.confidence === 'medium' ? 'متوسط' : 'کم'}` : `Confidence: ${result.confidence}`}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <NutrientDisplay label={t('today.calories')} value={result.calories} unit="kcal" />
              <NutrientDisplay label={t('today.protein')} value={result.protein} unit="g" />
              <NutrientDisplay label={locale === 'fa' ? 'کربوهیدرات' : 'Carbs'} value={result.carbohydrates} unit="g" />
              <NutrientDisplay label={locale === 'fa' ? 'چربی' : 'Fat'} value={result.fat} unit="g" />
            </div>
            {result.assumptions.length > 0 && <Alert><AlertTitle>{locale === 'fa' ? 'فرض‌های تخمین' : 'Assumptions'}</AlertTitle><AlertDescription><ul className="list-disc space-y-1 ps-5">{result.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></AlertDescription></Alert>}
          </CardContent>
        </Card>
      )}
      {!isLoading && !result && !error && <div className="rounded-lg border-2 border-dashed p-8 text-center"><Wheat className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-medium">{t('nutrition.foodLibrary')}</h3><p className="mt-1 text-sm text-muted-foreground">{t('nutrition.foodLibraryDescription')}</p></div>}
    </div>
  );
}
