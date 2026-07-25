'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, Camera, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { foodLookup } from '@/ai/flows/food-lookup';
import type { FoodLookupOutput } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/context/user-profile-context';
import { useI18n } from '@/i18n/provider';
import { AiClientError } from '@/lib/ai-client';

function NutrientDisplay({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-lg bg-secondary p-3 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-primary">{Math.round(value)}<span className="ms-1 text-sm text-primary/80">{unit}</span></p>
    </div>
  );
}

export function FoodCameraLookup() {
  const [result, setResult] = React.useState<FoodLookupOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user, logMeal } = useUserData();
  const { locale, t } = useI18n();

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    const requestCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Camera access failed:', error);
        setHasCameraPermission(false);
      }
    };
    void requestCamera();
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, []);

  const analyze = async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      toast({ variant: 'destructive', title: locale === 'fa' ? 'دوربین آماده نیست' : 'Camera is not ready' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const maxDimension = 1_280;
      const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
      const canvas = canvasRef.current;
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image capture is unavailable.');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg', 0.82);
      setResult(await foodLookup({ foodName: '', photoDataUri, locale }));
    } catch (error) {
      console.error('Food scan failed:', error);
      toast({
        variant: 'destructive',
        title: locale === 'fa' ? 'تحلیل تصویر انجام نشد' : 'Image analysis failed',
        description: error instanceof AiClientError && error.status === 429
          ? (locale === 'fa' ? 'سهمیه اسکن امروز تمام شده است.' : 'Today’s scan limit has been reached.')
          : (locale === 'fa' ? 'تصویر واضح‌تر و سهم مشخص‌تری از غذا ثبت کنید.' : 'Try a clearer image with a more visible portion.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logResult = async () => {
    if (!result) return;
    try {
      await logMeal({
        mealType: 'snack',
        description: `${result.itemName} — ${result.servingSize}`,
        calories: result.calories,
        protein: result.protein,
        carbohydrates: result.carbohydrates,
        fat: result.fat,
      });
      toast({ title: locale === 'fa' ? 'وعده ثبت شد' : 'Meal logged' });
      setResult(null);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error instanceof Error ? error.message : undefined });
    }
  };

  if (hasCameraPermission === null) {
    return <div className="flex h-96 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /><p className="mt-4 text-muted-foreground">{locale === 'fa' ? 'در حال درخواست دسترسی دوربین…' : 'Requesting camera access…'}</p></div>;
  }

  if (hasCameraPermission === false) {
    return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{locale === 'fa' ? 'دسترسی دوربین داده نشد' : 'Camera access denied'}</AlertTitle><AlertDescription>{locale === 'fa' ? 'دسترسی دوربین را در تنظیمات مرورگر یا برنامه فعال کنید.' : 'Enable camera permission in the browser or app settings.'}</AlertDescription></Alert>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Alert><AlertDescription>{t('nutrition.estimateWarning')}</AlertDescription></Alert>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted aria-label={locale === 'fa' ? 'پیش‌نمایش دوربین' : 'Camera preview'} />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-4 start-1/2 -translate-x-1/2">
          <Button size="icon" className="h-16 w-16 rounded-full" onClick={() => void analyze()} disabled={isLoading} aria-label={t('nutrition.scanMeal')}>
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
          </Button>
        </div>
      </div>

      {result && (
        <Card className="animate-in fade-in-50">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle className="font-headline text-2xl">{result.itemName}</CardTitle><p className="text-muted-foreground">{locale === 'fa' ? 'اندازه سهم' : 'Serving'}: {result.servingSize}</p></div>
              <Badge variant={result.confidence === 'high' ? 'default' : 'secondary'}>{locale === 'fa' ? `اطمینان ${result.confidence === 'high' ? 'زیاد' : result.confidence === 'medium' ? 'متوسط' : 'کم'}` : `${result.confidence} confidence`}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <NutrientDisplay label={t('today.calories')} value={result.calories} unit="kcal" />
              <NutrientDisplay label={t('today.protein')} value={result.protein} unit="g" />
              <NutrientDisplay label={locale === 'fa' ? 'کربوهیدرات' : 'Carbs'} value={result.carbohydrates} unit="g" />
              <NutrientDisplay label={locale === 'fa' ? 'چربی' : 'Fat'} value={result.fat} unit="g" />
            </div>
            {result.assumptions.length > 0 && <Alert><AlertTitle>{locale === 'fa' ? 'فرض‌های تخمین' : 'Estimation assumptions'}</AlertTitle><AlertDescription><ul className="list-disc space-y-1 ps-5">{result.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></AlertDescription></Alert>}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button onClick={() => void logResult()} className="w-full"><CheckCircle className="me-2 h-4 w-4" />{locale === 'fa' ? 'ثبت وعده' : 'Log meal'}</Button>
              <Button onClick={() => setResult(null)} variant="outline" className="w-full"><RefreshCw className="me-2 h-4 w-4" />{locale === 'fa' ? 'اسکن دوباره' : 'Scan another'}</Button>
            </div>
            <Button variant="link" asChild className="w-full"><Link href="/pricing">{t('common.upgrade')}</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
