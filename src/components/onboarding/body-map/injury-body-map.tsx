"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getBodyPart } from "./body-parts";
import type { InjuryArea } from "@/lib/onboarding-model";
import "./body-map.css";

type BodyPart = {
  face: "ant" | "post";
  name: string;
  id: string;
  d: string;
};

function persianBodyLabel(name: string) {
  const lower = name.toLowerCase();
  const side = lower.includes("left") ? "چپ" : lower.includes("right") ? "راست" : "";
  const face = lower.includes("post") ? "پشت" : lower.includes("ant") ? "جلو" : "";
  const dictionary: Array<[string, string]> = [
    ["head", "سر"],
    ["neck", "گردن"],
    ["trapezius", "عضله ذوزنقه‌ای"],
    ["shoulder", "شانه"],
    ["biceps", "جلوی بازو"],
    ["triceps", "پشت بازو"],
    ["elbow", "آرنج"],
    ["forearm", "ساعد"],
    ["wrist", "مچ دست"],
    ["hand", "دست"],
    ["pectoral", "سینه"],
    ["rib", "دنده"],
    ["adbominals", "شکم"],
    ["abdominals", "شکم"],
    ["obliques", "پهلو"],
    ["hip", "لگن"],
    ["quadriceps", "جلوی ران"],
    ["adductor", "داخل ران"],
    ["knee", "زانو"],
    ["shin", "ساق جلو"],
    ["ankle", "مچ پا"],
    ["foot", "پا"],
    ["spinal", "ستون فقرات"],
    ["scapula", "کتف"],
    ["lumbar", "کمر"],
    ["back", "پشت"],
    ["buttock", "باسن"],
    ["hamstring", "پشت ران"],
    ["calf", "ساق پا"],
  ];
  const base = dictionary.find(([needle]) => lower.includes(needle))?.[1] || name;
  return [base, side, face].filter(Boolean).join(" ");
}

function BodyContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="injury-body-svg-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375.42 832.97" aria-hidden="true">
        <g>{children}</g>
      </svg>
    </div>
  );
}

export function InjuryBodyMap({ value, onChange }: { value: InjuryArea[]; onChange: (areas: InjuryArea[]) => void }) {
  const [hovered, setHovered] = React.useState<string | null>(null);
  const bodyParts = React.useMemo(() => getBodyPart("en") as BodyPart[], []);
  const anterior = React.useMemo(() => bodyParts.filter((part) => part.face === "ant"), [bodyParts]);
  const posterior = React.useMemo(() => bodyParts.filter((part) => part.face === "post"), [bodyParts]);
  const selectedKeys = React.useMemo(() => new Set(value.map((area) => area.key)), [value]);

  const toggle = (part: BodyPart) => {
    const key = `${part.face}:${part.id}`;
    if (selectedKeys.has(key)) {
      onChange(value.filter((area) => area.key !== key));
      return;
    }
    onChange([
      ...value,
      {
        key,
        bodyPartId: part.id,
        face: part.face,
        label: persianBodyLabel(part.name),
        severity: "mild",
        status: "current",
        forbiddenMovements: "",
        notes: "",
      },
    ]);
  };

  const updateArea = (key: string, patch: Partial<InjuryArea>) => {
    onChange(value.map((area) => (area.key === key ? { ...area, ...patch } : area)));
  };

  const renderBody = (parts: BodyPart[]) => (
    <BodyContainer>
      {parts.map((part) => {
        const key = `${part.face}:${part.id}`;
        const isSelected = selectedKeys.has(key);
        const isHovered = hovered === key;
        return (
          <path
            key={key}
            d={part.d}
            role="button"
            tabIndex={0}
            aria-label={`انتخاب ${persianBodyLabel(part.name)}`}
            aria-pressed={isSelected}
            onClick={() => toggle(part)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggle(part);
              }
            }}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
            className="injury-body-part"
            style={{
              fill: isSelected
                ? "hsl(var(--primary))"
                : isHovered
                  ? "hsl(var(--primary) / 0.55)"
                  : "hsl(var(--muted-foreground) / 0.72)",
            }}
          />
        );
      })}
    </BodyContainer>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-gradient-to-b from-muted/35 to-background p-4 sm:p-6">
        <div className="bodies-container injury-bodies-container">
          <div>
            <p>نمای جلوی بدن</p>
            {renderBody(anterior)}
          </div>
          <div>
            <p>نمای پشت بدن</p>
            {renderBody(posterior)}
          </div>
        </div>
        <p className="mt-3 text-center text-sm leading-7 text-muted-foreground">
          روی هر بخش از بدن بزن. برای حذف، دوباره همان ناحیه را انتخاب کن یا از فهرست پایین حذفش کن.
        </p>
      </div>

      <div className="selected-parts-container">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">ناحیه‌های انتخاب‌شده</h3>
            <p className="mt-1 text-sm text-muted-foreground">برای هر ناحیه، وضعیت و محدودیت حرکتی را مشخص کن.</p>
          </div>
          <Badge variant={value.length ? "default" : "secondary"}>{value.length} ناحیه</Badge>
        </div>

        {value.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            هنوز ناحیه‌ای انتخاب نشده است.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {value.map((area) => (
              <div key={area.key} className="rounded-2xl border bg-background p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{area.label}</p>
                    <p className="text-xs text-muted-foreground">{area.face === "ant" ? "نمای جلو" : "نمای پشت"}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((item) => item.key !== area.key))} aria-label={`حذف ${area.label}`}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>وضعیت آسیب</Label>
                    <Select value={area.status} onValueChange={(status: InjuryArea["status"]) => updateArea(area.key, { status })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">در حال حاضر درد یا محدودیت دارد</SelectItem>
                        <SelectItem value="past">آسیب قبلی و فعلاً کنترل‌شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>شدت</Label>
                    <Select value={area.severity} onValueChange={(severity: InjuryArea["severity"]) => updateArea(area.key, { severity })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">خفیف</SelectItem>
                        <SelectItem value="moderate">متوسط</SelectItem>
                        <SelectItem value="severe">شدید</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`forbidden-${area.key}`}>حرکت‌هایی که درد ایجاد می‌کنند یا ممنوع‌اند</Label>
                    <Input id={`forbidden-${area.key}`} value={area.forbiddenMovements} onChange={(event) => updateArea(area.key, { forbiddenMovements: event.target.value })} placeholder="مثلاً اسکوات عمیق، پرس بالای سر یا دویدن" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`notes-${area.key}`}>توضیح تکمیلی</Label>
                    <Textarea id={`notes-${area.key}`} value={area.notes} onChange={(event) => updateArea(area.key, { notes: event.target.value })} placeholder="زمان شروع، تشخیص قبلی، فیزیوتراپی یا شرایطی که درد بیشتر می‌شود" className="min-h-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
