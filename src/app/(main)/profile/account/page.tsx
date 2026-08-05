"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, Loader2, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/context/user-profile-context";

const schema = z.object({ displayName: z.string().trim().min(2, "نام باید حداقل دو حرف باشد.").max(60, "نام واردشده بیش از حد طولانی است.") });
type Values = z.infer<typeof schema>;

export default function AccountSettingsPage() {
  const { user, userProfile, updateUserAccount } = useUserData();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { displayName: userProfile?.name || user?.displayName || "عماد" } });

  React.useEffect(() => {
    form.reset({ displayName: userProfile?.name || user?.displayName || "عماد" });
  }, [form, user, userProfile]);

  const submit = async (values: Values) => {
    setSubmitting(true);
    try {
      await updateUserAccount({ displayName: values.displayName });
      toast({ title: "نام نمایشی ذخیره شد", description: "تغییر در همین مرورگر نگهداری می‌شود." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl py-3">
        <Button variant="ghost" asChild className="mb-5"><Link href="/profile"><ArrowRight className="ml-2 h-4 w-4" />بازگشت به پروفایل</Link></Button>
        <header className="mb-7"><h1 className="text-3xl font-black sm:text-4xl">مدیریت حساب محلی</h1><p className="mt-2 text-muted-foreground">در نسخهٔ فعلی فقط نام نمایشی واقعاً قابل‌تغییر است.</p></header>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />نام نمایشی</CardTitle><CardDescription>این نام در پروفایل و بخش‌های شخصی برنامه نمایش داده می‌شود.</CardDescription></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
                <FormField control={form.control} name="displayName" render={({ field }) => <FormItem><FormLabel>نام نمایشی</FormLabel><FormControl><Input autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>} />
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}ذخیره نام</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />ایمیل حساب نمایشی</CardTitle><CardDescription>تغییر ایمیل به احراز هویت واقعی نیاز دارد و فعلاً غیرفعال است.</CardDescription></CardHeader>
          <CardContent><div className="rounded-xl border bg-muted/35 px-4 py-3 font-medium text-muted-foreground" dir="ltr">{user?.email || "demo@neofit.local"}</div></CardContent>
        </Card>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border bg-muted/30 p-4 text-sm leading-7 text-muted-foreground">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <p>ورود، خروج، تغییر ایمیل و رمز عبور و مدیریت نشست‌ها پس از اتصال Supabase Auth فعال می‌شوند. این صفحه چنین قابلیت‌هایی را فعال یا شبیه‌سازی نمی‌کند.</p>
        </div>
      </div>
    </main>
  );
}
