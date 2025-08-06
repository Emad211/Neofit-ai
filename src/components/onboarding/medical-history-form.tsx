"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

const medicalConditions = [
  {
    id: "cardiovascular",
    label: "Cardiovascular Issues",
    details: [
      { id: "high_blood_pressure", label: "High Blood Pressure" },
      { id: "heart_condition", label: "Known Heart Condition" },
      { id: "cholesterol", label: "High Cholesterol" },
    ],
    requiresDetails: true,
  },
  {
    id: "musculoskeletal",
    label: "Musculoskeletal Issues",
    details: [
      { id: "arthritis", label: "Arthritis" },
      { id: "back_pain", label: "Chronic Back Pain" },
      { id: "osteoporosis", label: "Osteoporosis" },
    ],
    requiresDetails: true,
  },
  {
    id: "metabolic",
    label: "Metabolic Conditions",
    details: [
      { id: "type_1_diabetes", label: "Type 1 Diabetes" },
      { id: "type_2_diabetes", label: "Type 2 Diabetes" },
      { id: "thyroid", label: "Thyroid Issues" },
    ],
    requiresDetails: true,
  },
  {
    id: "respiratory",
    label: "Respiratory Issues",
    details: [
        { id: "asthma", label: "Asthma" },
        { id: "copd", label: "COPD" },
    ],
    requiresDetails: false
  }
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
            details: searchParams.get('medicalHistory') || ''
        }
    });

    React.useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            const params = new URLSearchParams(searchParams);
            const selectedConditions = value.conditions?.join(', ') || '';
            const otherDetails = value.details || '';
            
            let combined = [selectedConditions, otherDetails]
                .filter(Boolean)
                .join('; ');
            
            params.set('medicalHistory', combined || 'None');
            
            // We only want to push the history, not change the URL, so we use replace
            router.replace(`${window.location.pathname}?${params.toString()}`, {scroll: false});
        });
        return () => subscription.unsubscribe();
    }, [form, searchParams, router]);
    

    return (
        <Form {...form}>
            <form className="w-full max-w-2xl mx-auto space-y-4">
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
                                                render={({ field }) => {
                                                    return (
                                                    <FormItem
                                                        key={item.id}
                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                    >
                                                        <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), item.id])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                    (value) => value !== item.id
                                                                    )
                                                                )
                                                            }}
                                                        />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                        {item.label}
                                                        </FormLabel>
                                                    </FormItem>
                                                    )
                                                }}
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
                        <FormLabel className="font-semibold">Other Conditions or Details</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Please provide any other relevant medical information here."
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}