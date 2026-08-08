'use client';

import { useMemo, useState } from 'react';
import { getBodyPart } from './body-parts';
import type { InjuryArea } from '@/lib/onboarding/model';

type BodyPart = { face: 'ant' | 'post'; name: string; id: string; d: string };

function persianBodyLabel(name: string) {
  const lower = name.toLowerCase();
  const side = lower.includes('left') ? 'چپ' : lower.includes('right') ? 'راست' : '';
  const face = lower.includes('post') ? 'پشت' : lower.includes('ant') ? 'جلو' : '';
  const dictionary: Array<[string, string]> = [
    ['head', 'سر'], ['neck', 'گردن'], ['trapezius', 'عضله ذوزنقه‌ای'], ['shoulder', 'شانه'],
    ['biceps', 'جلوی بازو'], ['triceps', 'پشت بازو'], ['elbow', 'آرنج'], ['forearm', 'ساعد'],
    ['wrist', 'مچ دست'], ['hand', 'دست'], ['pectoral', 'سینه'], ['rib', 'دنده'],
    ['adbominals', 'شکم'], ['abdominals', 'شکم'], ['obliques', 'پهلو'], ['hip', 'لگن'],
    ['quadriceps', 'جلوی ران'], ['adductor', 'داخل ران'], ['knee', 'زانو'], ['shin', 'ساق جلو'],
    ['ankle', 'مچ پا'], ['foot', 'پا'], ['spinal', 'ستون فقرات'], ['scapula', 'کتف'],
    ['lumbar', 'کمر'], ['back', 'پشت'], ['buttock', 'باسن'], ['hamstring', 'پشت ران'], ['calf', 'ساق پا'],
  ];
  const base = dictionary.find(([needle]) => lower.includes(needle))?.[1] ?? name;
  return [base, side, face].filter(Boolean).join(' ');
}

function BodySvg({ parts, selected, hovered, onHover, onToggle }: {
  parts: BodyPart[];
  selected: Set<string>;
  hovered: string | null;
  onHover(key: string | null): void;
  onToggle(part: BodyPart): void;
}) {
  return (
    <svg className="onboarding-body-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375.42 832.97" aria-label="نقشه تعاملی بدن">
      <g>{parts.map((part) => {
        const key = `${part.face}:${part.id}`;
        const active = selected.has(key);
        return <path key={key} d={part.d} role="button" tabIndex={0} aria-label={`انتخاب ${persianBodyLabel(part.name)}`} aria-pressed={active}
          className={active ? 'onboarding-body-part is-selected' : hovered === key ? 'onboarding-body-part is-hovered' : 'onboarding-body-part'}
          onClick={() => onToggle(part)} onMouseEnter={() => onHover(key)} onMouseLeave={() => onHover(null)}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle(part); } }} />;
      })}</g>
    </svg>
  );
}

export function InjuryBodyMap({ value, onChange }: { value: InjuryArea[]; onChange(value: InjuryArea[]): void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const bodyParts = useMemo(() => getBodyPart('en') as BodyPart[], []);
  const anterior = useMemo(() => bodyParts.filter((part) => part.face === 'ant'), [bodyParts]);
  const posterior = useMemo(() => bodyParts.filter((part) => part.face === 'post'), [bodyParts]);
  const selected = useMemo(() => new Set(value.map((area) => area.key)), [value]);

  const toggle = (part: BodyPart) => {
    const key = `${part.face}:${part.id}`;
    if (selected.has(key)) {
      onChange(value.filter((area) => area.key !== key));
      return;
    }
    onChange([...value, { key, bodyPartId: part.id, face: part.face, label: persianBodyLabel(part.name), severity: 'mild', status: 'current', forbiddenMovements: '', notes: '' }]);
  };

  const update = (key: string, patch: Partial<InjuryArea>) => onChange(value.map((area) => area.key === key ? { ...area, ...patch } : area));

  return <div className="onboarding-body-map">
    <div className="onboarding-body-map__figures">
      <figure><figcaption>نمای جلوی بدن</figcaption><BodySvg parts={anterior} selected={selected} hovered={hovered} onHover={setHovered} onToggle={toggle} /></figure>
      <figure><figcaption>نمای پشت بدن</figcaption><BodySvg parts={posterior} selected={selected} hovered={hovered} onHover={setHovered} onToggle={toggle} /></figure>
    </div>
    <p className="onboarding-help">روی هر ناحیه بزن. انتخاب دوباره همان ناحیه آن را حذف می‌کند.</p>
    <div className="onboarding-selected-areas">
      <div className="onboarding-subheading"><div><h3>ناحیه‌های انتخاب‌شده</h3><p>برای هر ناحیه، شدت و محدودیت را ثبت کن.</p></div><span>{value.length.toLocaleString('fa-IR')} ناحیه</span></div>
      {value.length === 0 ? <p className="onboarding-empty">هنوز ناحیه‌ای انتخاب نشده است.</p> : value.map((area) => <article className="onboarding-area-card" key={area.key}>
        <div className="onboarding-area-card__head"><div><strong>{area.label}</strong><small>{area.face === 'ant' ? 'نمای جلو' : 'نمای پشت'}</small></div><button type="button" onClick={() => onChange(value.filter((item) => item.key !== area.key))} aria-label={`حذف ${area.label}`}>×</button></div>
        <div className="onboarding-grid onboarding-grid--2">
          <label>وضعیت آسیب<select value={area.status} onChange={(event) => update(area.key, { status: event.target.value as InjuryArea['status'] })}><option value="current">در حال حاضر درد یا محدودیت دارد</option><option value="past">آسیب قبلی و فعلاً کنترل‌شده</option></select></label>
          <label>شدت<select value={area.severity} onChange={(event) => update(area.key, { severity: event.target.value as InjuryArea['severity'] })}><option value="mild">خفیف</option><option value="moderate">متوسط</option><option value="severe">شدید</option></select></label>
        </div>
        <label>حرکت‌های دردناک یا ممنوع<input value={area.forbiddenMovements} onChange={(event) => update(area.key, { forbiddenMovements: event.target.value })} placeholder="مثلاً اسکوات عمیق یا پرس بالای سر" /></label>
        <label>توضیح تکمیلی<textarea value={area.notes} onChange={(event) => update(area.key, { notes: event.target.value })} placeholder="تشخیص قبلی، فیزیوتراپی یا شرایط تشدید درد" /></label>
      </article>)}
    </div>
  </div>;
}
