"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MoveRight, Save, Loader2, ShieldCheck } from "lucide-react";
import { useUserData } from "@/context/user-profile-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  displayName: z.string().min(2, "نام باید حداقل دو حرف باشد."),
  email: z.string().email("ایمیل معتبر وارد کن."),
});

type Values = z.infer<typeof schema>;

export default function AccountSettingsPage() {
  const { user, updateUserAccount, updateUserEmail } = useUserData();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName || "عماد",
      email: user?.email || "demo@neofit.local",
    },
  });

  React.useEffect(() => {
    form.reset({
      displayName: user?.displayName || "عماد",
      email: user?.email || "demo@neofit.local",
    });
  }, [form, user]);

  const submit = async (values: Values) => {
    setSubmitting(true);
    try {
      await updateUserAccount({ displayName: values.displayName });
      await updateUserEmail(values.email);
      toast({ title: "ذخیره شد", description: "اطلاعات حساب محلی به‌روزرسانی شد." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/profile"><MoveRight className="ml-2 h-4 w-4" />بازگشت به پروفایل</Link>
        </Button>

        <header className="mb-8 text-right">
          <h1 className="text-4xl font-extrabold">تنظیمات حساب</h1>
          <p className="mt-2 text-muted-foreground">اطلاعات نسخهٔ نمایشی را مدیریت کن.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>مشخصات حساب</CardTitle>
            <CardDescription>این داده‌ها فعلاً فقط در مرورگر همین دستگاه ذخیره می‌شوند.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
                <FormField control={form.control} name="displayName" render={({ field }) => (
                  <FormItem><FormLabel>نام نمایشی</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>ایمیل</FormLabel><FormControl><Input type="email" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                  ذخیره تغییرات
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-start gap-3 rounded-xl border bg-secondary/40 p-4 text-sm leading-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          ورود، تغییر رمز و همگام‌سازی چنددستگاهی بعد از اتصال زیرساخت حساب جدید فعال می‌شوند.
        </div>
      </div>
    </main>
  );
}
