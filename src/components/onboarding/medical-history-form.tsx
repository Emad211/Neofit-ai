"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const medicalConditions = [
  {
    id: "cardiovascular",
    label: "مشکلات قلب و عروق",
    details: [
      { id: "high_blood_pressure", label: "فشار خون بالا" },
      { id: "heart_condition", label: "بیماری شناخته‌شدهٔ قلبی" },
      { id: "cholesterol", label: "کلسترول بالا" },
    ],
  },
  {
    id: "musculoskeletal",
    label: "مشکلات اسکلتی و عضلانی",
    details: [
      { id: "arthritis", label: "آرتروز" },
      { id: "back_pain", label: "کمردرد مزمن" },
      { id: "osteoporosis", label: "پوکی استخوان" },
    ],
  },
  {
    id: "metabolic",
    label: "بیماری‌های متابولیک",
    details: [
      { id: "type_1_diabetes", label: "دیابت نوع یک" },
      { id: "type_2_diabetes", label: "دیابت نوع دو" },
      { id: "thyroid", label: "مشکلات تیروئید" },
    ],
  },
  {
    id: "respiratory",
    label: "مشکلات تنفسی",
    details: [
      { id: "asthma", label: "آسم" },
      { id: "copd", label: "بیماری مزمن انسدادی ریه" },
    ],
  },
];

const FormSchema = z.object({
  conditions: z.array(z.string()),
  details: z.string().optional(),
});

export function MedicalHistoryForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      conditions: [],
      details: searchParams.get("medicalHistory") || "",
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      const params = new URLSearchParams(searchParams);
      const conditions = (value.conditions || [])
        .filter((condition): condition is string => typeof condition === "string")
        .map((condition) => condition.replace(/_/g, " "))
        .join(", ");
      const details = value.details || "";
      const combined = [conditions, details].filter(Boolean).join("; ");
      params.set("medicalHistory", combined || "None");
      router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    });
    return () => subscription.unsubscribe();
  }, [form, searchParams, router]);

  return (
    <Form {...form}>
      <form dir="rtl" className="mx-auto w-full max-w-2xl space-y-4">
        <Accordion type="multiple" className="w-full">
          {medicalConditions.map((condition) => (
            <AccordionItem value={condition.id} key={condition.id}>
              <AccordionTrigger className="font-semibold">{condition.label}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 p-2">
                  <FormField
                    control={form.control}
                    name="conditions"
                    render={() => (
                      <FormItem>
                        {condition.details.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="conditions"
                            render={({ field }) => (
                              <FormItem className="flex flex-row-reverse items-start justify-end gap-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value.includes(item.id)}
                                    onCheckedChange={(checked) => field.onChange(
                                      checked
                                        ? [...field.value, item.id]
                                        : field.value.filter((value) => value !== item.id),
                                    )}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">سایر بیماری‌ها یا توضیحات</FormLabel>
              <FormControl>
                <Textarea placeholder="هر اطلاعات پزشکی مرتبط دیگری را اینجا وارد کن." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
