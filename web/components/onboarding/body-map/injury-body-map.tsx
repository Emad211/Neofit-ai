'use client';

import { useMemo, useState } from 'react';
import { getBodyPart } from './body-parts';
import type { InjuryArea } from '@/lib/onboarding/model';

type BodyFace = 'ant' | 'post';
type BodyPart = { face: BodyFace; name: string; id: string; d: string };

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

function BodySvg({ parts, selected, hovered, onHover, onToggle, face }: {
  parts: BodyPart[];
  selected: Set<string>;
  hovered: string | null;
  onHover(key: string | null): void;
  onToggle(part: BodyPart): void;
  face: BodyFace;
}) {
  return (
    <svg
      className="onboarding-body-svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 375.42 832.97"
      aria-label={face === 'ant' ? 'نقشه تعاملی جلوی بدن' : 'نقشه تعاملی پشت بدن'}
    >
      <g>{parts.map((part) => {
        const key = `${part.face}:${part.id}`;
        const active = selected.has(key);
        const className = active ? 'onboarding-body-part is-selected' : hovered === key ? 'onboarding-body-part is-hovered' : 'onboarding-body-part';
        return (
          <path
            key={key}
            d={part.d}
            role="button"
            tabIndex={0}
            aria-label={`${active ? 'حذف' : 'انتخاب'} ${persianBodyLabel(part.name)}`}
            aria-pressed={active}
            className={className}
            onClick={() => onToggle(part)}
            onPointerEnter={() => onHover(key)}
            onPointerLeave={() => onHover(null)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggle(part);
              }
            }}
          />
        );
      })}</g>
    </svg>
  );
}

export function InjuryBodyMap({ value, onChange }: { value: InjuryArea[]; onChange(value: InjuryArea[]): void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeFace, setActiveFace] = useState<BodyFace>('ant');
  const [expandedKey, setExpandedKey] = useState<string | null>(value[0]?.key ?? null);
  const bodyParts = useMemo(() => getBodyPart('en') as BodyPart[], []);
  const anterior = useMemo(() => bodyParts.filter((part) => part.face === 'ant'), [bodyParts]);
  const posterior = useMemo(() => bodyParts.filter((part) => part.face === 'post'), [bodyParts]);
  const selected = useMemo(() => new Set(value.map((area) => area.key)), [value]);
  const availableAnterior = useMemo(() => anterior.filter((part) => !selected.has(`${part.face}:${part.id}`)), [anterior, selected]);
  const availablePosterior = useMemo(() => posterior.filter((part) => !selected.has(`${part.face}:${part.id}`)), [posterior, selected]);
  const anteriorCount = useMemo(() => value.filter((area) => area.face === 'ant').length, [value]);
  const posteriorCount = value.length - anteriorCount;

  const toggle = (part: BodyPart) => {
    const key = `${part.face}:${part.id}`;
    if (selected.has(key)) {
      onChange(value.filter((area) => area.key !== key));
      if (expandedKey === key) setExpandedKey(null);
      return;
    }
    onChange([...value, {
      key,
      bodyPartId: part.id,
      face: part.face,
      label: persianBodyLabel(part.name),
      severity: 'mild',
      status: 'current',
      forbiddenMovements: '',
      notes: '',
    }]);
    setExpandedKey(key);
    setActiveFace(part.face);
  };

  const update = (key: string, patch: Partial<InjuryArea>) => onChange(value.map((area) => area.key === key ? { ...area, ...patch } : area));

  return <div className="onboarding-body-map">
    <div className="onboarding-body-map__face-switch" role="tablist" aria-label="نمای بدن">
      <button type="button" role="tab" aria-selected={activeFace === 'ant'} className={activeFace === 'ant' ? 'is-selected' : ''} onClick={() => setActiveFace('ant')}>
        جلو {anteriorCount ? <span>{anteriorCount.toLocaleString('fa-IR')}</span> : null}
      </button>
      <button type="button" role="tab" aria-selected={activeFace === 'post'} className={activeFace === 'post' ? 'is-selected' : ''} onClick={() => setActiveFace('post')}>
        پشت {posteriorCount ? <span>{posteriorCount.toLocaleString('fa-IR')}</span> : null}
      </button>
    </div>

    <div className="onboarding-body-map__figures" data-active-face={activeFace}>
      <figure className={activeFace === 'ant' ? 'is-active' : ''}>
        <figcaption>نمای جلوی بدن</figcaption>
        <BodySvg parts={anterior} selected={selected} hovered={hovered} onHover={setHovered} onToggle={toggle} face="ant" />
      </figure>
      <figure className={activeFace === 'post' ? 'is-active' : ''}>
        <figcaption>نمای پشت بدن</figcaption>
        <BodySvg parts={posterior} selected={selected} hovered={hovered} onHover={setHovered} onToggle={toggle} face="post" />
      </figure>
    </div>
    <p className="onboarding-help">ناحیه را لمس کن تا انتخاب شود. اگر ناحیه کوچک است یا انتخاب دقیق سخت است، از فهرست جایگزین استفاده کن.</p>

    <details className="onboarding-body-map__list-picker">
      <summary>انتخاب ناحیه از فهرست</summary>
      {availableAnterior.length || availablePosterior.length ? (
        <label>ناحیه بدن
          <select
            value=""
            onChange={(event) => {
              const key = event.target.value;
              if (!key) return;
              const part = bodyParts.find((candidate) => `${candidate.face}:${candidate.id}` === key);
              if (part) toggle(part);
            }}
          >
            <option value="">ناحیه را انتخاب کن</option>
            {availableAnterior.length ? <optgroup label="جلوی بدن">{availableAnterior.map((part) => <option key={`list:${part.face}:${part.id}`} value={`${part.face}:${part.id}`}>{persianBodyLabel(part.name)}</option>)}</optgroup> : null}
            {availablePosterior.length ? <optgroup label="پشت بدن">{availablePosterior.map((part) => <option key={`list:${part.face}:${part.id}`} value={`${part.face}:${part.id}`}>{persianBodyLabel(part.name)}</option>)}</optgroup> : null}
          </select>
        </label>
      ) : <p className="onboarding-help">همه ناحیه‌ها انتخاب شده‌اند.</p>}
    </details>

    <div className="onboarding-selected-areas">
      <div className="onboarding-subheading">
        <div><h3>ناحیه‌های انتخاب‌شده</h3><p>هر ناحیه را باز کن و شدت یا حرکت‌های محدود را ثبت کن.</p></div>
        <span>{value.length.toLocaleString('fa-IR')} ناحیه</span>
      </div>
      {value.length === 0 ? <p className="onboarding-empty">هنوز ناحیه‌ای انتخاب نشده است.</p> : value.map((area) => (
        <details
          className="onboarding-area-card"
          key={area.key}
          open={expandedKey === area.key}
          onToggle={(event) => {
            const open = event.currentTarget.open;
            if (open) setExpandedKey(area.key);
            else if (expandedKey === area.key) setExpandedKey(null);
          }}
        >
          <summary className="onboarding-area-card__head">
            <div><strong>{area.label}</strong><small>{area.face === 'ant' ? 'نمای جلو' : 'نمای پشت'} · {area.status === 'current' ? 'فعلی' : 'قبلی'}</small></div>
            <span className="onboarding-area-card__chevron" aria-hidden="true">⌄</span>
          </summary>
          <div className="onboarding-area-card__body">
            <div className="onboarding-grid onboarding-grid--2">
              <label>وضعیت آسیب<select value={area.status} onChange={(event) => update(area.key, { status: event.target.value as InjuryArea['status'] })}><option value="current">الان درد یا محدودیت دارد</option><option value="past">آسیب قبلی و فعلاً کنترل‌شده</option></select></label>
              <label>شدت<select value={area.severity} onChange={(event) => update(area.key, { severity: event.target.value as InjuryArea['severity'] })}><option value="mild">خفیف</option><option value="moderate">متوسط</option><option value="severe">شدید</option></select></label>
            </div>
            <label>حرکت‌های دردناک یا ممنوع<input maxLength={700} value={area.forbiddenMovements} onChange={(event) => update(area.key, { forbiddenMovements: event.target.value })} placeholder="مثلاً اسکوات عمیق یا پرس بالای سر" /></label>
            <label>توضیح تکمیلی<textarea maxLength={2000} value={area.notes} onChange={(event) => update(area.key, { notes: event.target.value })} placeholder="تشخیص قبلی، فیزیوتراپی یا شرایط تشدید درد" /></label>
            <button type="button" className="onboarding-area-card__remove" onClick={() => {
              onChange(value.filter((item) => item.key !== area.key));
              if (expandedKey === area.key) setExpandedKey(null);
            }}>حذف این ناحیه</button>
          </div>
        </details>
      ))}
    </div>
  </div>;
}
