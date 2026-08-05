"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, HeartPulse, Loader2, Save, Salad, UserRound, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserData, type UserProfile } from "@/context/user-profile-context";

type Values = {
  goal: UserProfile["goal"];
  weight: number;
  fitnessLevel: UserProfile["fitnessLevel"];
  trainingDays: string;
  trainingDuration: string;
  workoutLocation: UserProfile["workoutLocation"];
  availableEquipment: string;
  lifestyle: UserProfile["lifestyle"];
  sleepHours: string;
  stressLevel: UserProfile["stressLevel"];
  cookingSkill: UserProfile["cookingSkill"];
  costLevel: UserProfile["costLevel"];
  eatingHabits: string;
  performanceGoals: string;
  medicalHistory: string;
};

function valuesFromProfile(profile: UserProfile): Values {
  return {
    goal: profile.goal,
    weight: profile.weight,
    fitnessLevel: profile.fitnessLevel,
    trainingDays: profile.trainingDays,
    trainingDuration: profile.trainingDuration,
    workoutLocation: profile.workoutLocation,
    availableEquipment: profile.availableEquipment || "",
    lifestyle: profile.lifestyle,
    sleepHours: profile.sleepHours,
    stressLevel: profile.stressLevel,
    cookingSkill: profile.cookingSkill,
    costLevel: profile.costLevel,
    eatingHabits: profile.eatingHabits || "",
    performanceGoals: profile.performanceGoals || "",
    medicalHistory: profile.medicalHistory || "",
  };
}

export default function EditProfilePage() {
  const { userProfile, saveUserProfile, isLoading } = useUserData();
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<Values>({
    defaultValues: {
      goal: "lose_weight",
      weight: 95,
      fitnessLevel: "intermediate",
      trainingDays: "3",
      trainingDuration: "60-90",
      workoutLocation: "gym",
      availableEquipment: "",
      lifestyle: "moderately_active",
      sleepHours: "7-8",
      stressLevel: "medium",
      cookingSkill: "intermediate",
      costLevel: "medium",
      eatingHabits: "",
      performanceGoals: "",
      medicalHistory: "",
    },
  });

  React.useEffect(() => {
    if (userProfile) form.reset(valuesFromProfile(userProfile));
  }, [form, userProfile]);

  const submit = async (values: Values) => {
    if (!userProfile) return;
    if (!Number.isFinite(values.weight) || values.weight < 30 || values.weight > 300) {
      form.setError("weight", { message: "وزن باید عددی بین ۳۰ تا ۳۰۰ کیلوگرم باشد." });
      return;
    }

    setSubmitting(true);
    try {
      await saveUserProfile({ ...userProfile, ...values });
      toast({ title: "مشخصات ذخیره شد", description: "تغییرات در همین مرورگر نگهداری می‌شوند." });
      router.push("/profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-5xl"><Skeleton className="h-10 w-52" /><Skeleton className="mt-3 h-4 w-72" /><div className="mt-8 space-y-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-48" />)}</div></div></main>;
  }

  if (!userProfile) {
    return <main dir="rtl" className="grid min-h-[70vh] place-items-center p-6 text-center"><div><UserRound className="mx-auto h-12 w-12 text-muted-foreground" /><h1 className="mt-4 text-2xl font-black">پروفایلی برای ویرایش وجود ندارد</h1><Button asChild className="mt-5"><Link href="/onboarding">تکمیل اطلاعات اولیه</Link></Button></div></main>;
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl py-3">
        <Button variant="ghost" asChild className="mb-5"><Link href="/profile"><ArrowRight className="ml-2 h-4 w-4" />بازگشت به پروفایل</Link></Button>
        <header className="mb-7"><h1 className="text-3xl font-black sm:text-4xl">ویرایش مشخصات</h1><p className="mt-2 text-muted-foreground">فقط اطلاعاتی را تغییر بده که بر برنامه و تجربهٔ روزانه اثر مستقیم دارند.</p></header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />هدف و وضعیت فعلی</CardTitle></CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <FormField control={form.control} name="goal" render={({ field }) => <FormItem><FormLabel>هدف اصلی</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="lose_weight">کاهش وزن و چربی</SelectItem><SelectItem value="gain_muscle">افزایش عضله</SelectItem><SelectItem value="improve_fitness">بهبود آمادگی جسمانی</SelectItem></SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="weight" render={({ field }) => <FormItem><FormLabel>وزن فعلی</FormLabel><FormControl><Input type="number" min={30} max={300} step="0.1" inputMode="decimal" value={Number.isFinite(field.value) ? field.value : ""} onChange={(event) => field.onChange(event.target.value === "" ? Number.NaN : Number(event.target.value))} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl><FormDescription>کیلوگرم</FormDescription><FormMessage /></FormItem>} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" />تمرین و فعالیت</CardTitle></CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <FormField control={form.control} name="fitnessLevel" render={({ field }) => <FormItem><FormLabel>سطح تمرین</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="beginner">مبتدی</SelectItem><SelectItem value="intermediate">متوسط</SelectItem><SelectItem value="advanced">پیشرفته</SelectItem></SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="trainingDays" render={({ field }) => <FormItem><FormLabel>روزهای تمرین در هفته</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{["2", "3", "4", "5", "6"].map((day) => <SelectItem key={day} value={day}>{Number(day).toLocaleString("fa-IR")} روز</SelectItem>)}</SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="trainingDuration" render={({ field }) => <FormItem><FormLabel>مدت هر جلسه</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="<30">کمتر از ۳۰ دقیقه</SelectItem><SelectItem value="30-45">۳۰ تا ۴۵ دقیقه</SelectItem><SelectItem value="45-60">۴۵ تا ۶۰ دقیقه</SelectItem><SelectItem value="60-90">۶۰ تا ۹۰ دقیقه</SelectItem></SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="workoutLocation" render={({ field }) => <FormItem><FormLabel>محل تمرین</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="gym">باشگاه</SelectItem><SelectItem value="home">خانه</SelectItem></SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="lifestyle" render={({ field }) => <FormItem><FormLabel>فعالیت روزانه</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="sedentary">کم‌تحرک</SelectItem><SelectItem value="lightly_active">فعالیت سبک</SelectItem><SelectItem value="moderately_active">فعالیت متوسط</SelectItem><SelectItem value="very_active">بسیار فعال</SelectItem></SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="availableEquipment" render={({ field }) => <FormItem><FormLabel>تجهیزات موجود</FormLabel><FormControl><Input placeholder="مثلاً دمبل، کش یا تجهیزات کامل باشگاه" {...field} /></FormControl></FormItem>} />
                <FormField control={form.control} name="performanceGoals" render={({ field }) => <FormItem className="sm:col-span-2 lg:col-span-3"><FormLabel>هدف عملکردی</FormLabel><FormControl><Input placeholder="مثلاً افزایش قدرت یا آمادگی برای دویدن" {...field} /></FormControl></FormItem>} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Salad className="h-5 w-5 text-primary" />تغذیه و سبک زندگی</CardTitle></CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <FormField control={form.control} name="sleepHours" render={({ field }) => <FormItem><FormLabel>خواب معمول</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="<5">کمتر از ۵ ساعت</SelectItem><SelectItem value="5-6">۵ تا ۶ ساعت</SelectItem><SelectItem value="7-8">۷ تا ۸ ساعت</SelectItem><SelectItem value=">8">بیشتر از ۸ ساعت</SelectItem></SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="stressLevel" render={({ field }) => <FormItem><FormLabel>سطح استرس</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">کم</SelectItem><SelectItem value="medium">متوسط</SelectItem><SelectItem value="high">زیاد</SelectItem></SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="cookingSkill" render={({ field }) => <FormItem><FormLabel>مهارت آشپزی</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="beginner">مبتدی</SelectItem><SelectItem value="intermediate">متوسط</SelectItem><SelectItem value="advanced">ماهر</SelectItem></SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="costLevel" render={({ field }) => <FormItem><FormLabel>بودجه غذا</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">اقتصادی</SelectItem><SelectItem value="medium">متوسط</SelectItem><SelectItem value="high">آزاد</SelectItem></SelectContent></Select></FormItem>} />
                <FormField control={form.control} name="eatingHabits" render={({ field }) => <FormItem className="sm:col-span-2"><FormLabel>عادت‌ها، حساسیت یا محدودیت غذایی</FormLabel><FormControl><Input placeholder="موارد مهم برای برنامه غذایی" {...field} /></FormControl></FormItem>} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-primary" />سوابق و محدودیت‌های پزشکی</CardTitle></CardHeader>
              <CardContent><FormField control={form.control} name="medicalHistory" render={({ field }) => <FormItem><FormLabel>یادداشت پزشکی</FormLabel><FormControl><Textarea rows={5} placeholder="آسیب، بیماری، درد یا محدودیت مهم را ثبت کن" {...field} /></FormControl><FormDescription>این یادداشت جایگزین ارزیابی پزشک نیست.</FormDescription></FormItem>} /></CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild><Link href="/profile">انصراف</Link></Button>
              <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}ذخیره تغییرات</Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
