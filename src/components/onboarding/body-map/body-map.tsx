'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBodyPart } from './body-parts';
import './body-map.css';
import { Button } from '@/components/ui/button';
import { MoveRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/context/onboarding-context';
import { useI18n } from '@/i18n/provider';

const BodyContainer = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="mx-auto h-[500px] w-[207px]">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375.42 832.97" role="group" aria-label={label}>
      <g>{children}</g>
    </svg>
  </div>
);

function BodyPart({
  id,
  name,
  d,
  fill,
  selected,
  onToggle,
  onMouseEnter,
  onMouseLeave,
}: {
  id: string;
  name: string;
  d: string;
  fill: string;
  selected: boolean;
  onToggle: (id: string) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
}) {
  return (
    <path
      d={d}
      id={id}
      role="button"
      tabIndex={0}
      aria-label={name}
      aria-pressed={selected}
      onClick={() => onToggle(id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle(id);
        }
      }}
      onMouseEnter={() => onMouseEnter(id)}
      onMouseLeave={onMouseLeave}
      style={{ WebkitTapHighlightColor: 'transparent', cursor: 'pointer', fill }}
    />
  );
}

export const BodyMap = () => {
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const router = useRouter();
  const { draft, updateDraft } = useOnboarding();
  const { locale, t } = useI18n();
  const bodyParts = useMemo(() => getBodyPart(locale), [locale]);
  const anterior = useMemo(() => bodyParts.filter(({ face }) => face === 'ant'), [bodyParts]);
  const posterior = useMemo(() => bodyParts.filter(({ face }) => face === 'post'), [bodyParts]);

  const getFill = useCallback((id: string) => {
    if (selectedParts.has(id)) return 'hsl(var(--primary))';
    if (hovered === id) return 'hsl(var(--primary) / 0.5)';
    return 'hsl(var(--muted-foreground))';
  }, [selectedParts, hovered]);

  const toggle = (id: string) => {
    setSelectedParts((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedNames = useMemo(() => Array.from(selectedParts)
    .map((id) => bodyParts.find((part) => part.id === id)?.name)
    .filter((name): name is string => Boolean(name)), [selectedParts, bodyParts]);

  const submit = () => {
    const injuryPrefix = locale === 'fa' ? 'ناحیه دارای درد یا آسیب قبلی' : 'Current or previous pain/injury area';
    const injuryText = selectedNames.map((name) => `${injuryPrefix}: ${name}`).join('; ');
    const existing = draft.medicalHistory && draft.medicalHistory !== 'None' ? draft.medicalHistory : '';
    updateDraft({ medicalHistory: [existing, injuryText].filter(Boolean).join('; ') || 'None' });
    router.push('/onboarding/analysis');
  };

  const renderPart = (part: (typeof bodyParts)[number]) => (
    <BodyPart
      key={part.id}
      id={part.id}
      name={part.name}
      d={part.d}
      fill={getFill(part.id)}
      selected={selectedParts.has(part.id)}
      onToggle={toggle}
      onMouseEnter={setHovered}
      onMouseLeave={() => setHovered(null)}
    />
  );

  return (
    <div className="text-foreground">
      <div className="bodies-container">
        <div>
          <p className="text-center font-medium">{locale === 'fa' ? 'نمای جلو' : 'Front'}</p>
          <BodyContainer label={locale === 'fa' ? 'نقشه بدن از جلو' : 'Front body map'}>{anterior.map(renderPart)}</BodyContainer>
        </div>
        <div>
          <p className="text-center font-medium">{locale === 'fa' ? 'نمای پشت' : 'Back'}</p>
          <BodyContainer label={locale === 'fa' ? 'نقشه بدن از پشت' : 'Back body map'}>{posterior.map(renderPart)}</BodyContainer>
        </div>
      </div>
      <div className="selected-parts-container" aria-live="polite">
        <h3 className="text-lg font-semibold">{t('onboarding.painAreas')}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedNames.length
            ? selectedNames.map((name) => <Badge key={name} variant="secondary" className="text-base">{name}</Badge>)
            : <p className="text-muted-foreground">{t('common.none')}</p>}
        </div>
      </div>
      <div className="mt-8 text-center">
        <Button onClick={submit} size="lg" className="mx-auto w-full max-w-md bg-accent text-accent-foreground hover:bg-accent/90">
          {t('onboarding.analyze')} <MoveRight className="ms-2 h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
