"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function TagEditor({ value, onChange, placeholder }: { value: string[]; onChange: (value: string[]) => void; placeholder: string }) {
  const [input, setInput] = React.useState("");

  const add = () => {
    const normalized = input.trim().replace(/,$/, "");
    if (!normalized || value.includes(normalized)) return;
    onChange([...value, normalized]);
    setInput("");
  };

  return (
    <div className="space-y-3">
      {value.length ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Badge key={item} variant="secondary" className="gap-2 py-1.5 pl-2 pr-3 text-sm">
              {item}
              <button type="button" onClick={() => onChange(value.filter((candidate) => candidate !== item))} aria-label={`حذف ${item}`} className="rounded-full p-0.5 hover:bg-muted-foreground/15">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <Input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
      />
      <p className="text-xs text-muted-foreground">برای افزودن، Enter بزن یا بعد از هر مورد ویرگول وارد کن.</p>
    </div>
  );
}
