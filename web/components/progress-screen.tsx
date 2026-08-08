'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNutritionState } from '@/components/nutrition-state';
import {
  createLocalMeasurement,
  createMeasurementClient,
  readLocalBodyMeasurements,
  rowToBodyMeasurement,
  writeLocalBodyMeasurements,
  type BodyMeasurement,
} from '@/lib/progress/body-measurements';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' });

function parseOptionalPositive(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function parseOptionalPercent(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? number : undefined;
}

function metric(value: number | null | undefined, unit: string) {
  return value === null || value === undefined ? <strong>—</strong> : <strong>{faNumber.format(value)}<small> {unit}</small></strong>;
}

export function ProgressScreen() {
  const { account, localDate, summary } = useNutritionState();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      if (!account) {
        setMeasurements(readLocalBodyMeasurements());
        setLoading(false);
        return;
      }

      const supabase = createMeasurementClient();
      const { data, error: queryError } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', account.id)
        .order('measured_at', { ascending: false })
        .limit(180);
      if (cancelled) return;
      if (queryError) {
        setError('خواندن اندازه‌گیری‌های حساب انجام نشد.');
        setMeasurements([]);
      } else {
        setMeasurements((data ?? []).map(rowToBodyMeasurement).reverse());
      }
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [account?.id]);

  const weightRows = useMemo(
    () => measurements.filter((row) => row.weightKg !== null).slice(-8),
    [measurements],
  );
  const latest = measurements.at(-1) ?? null;
  const latestWeight = [...measurements].reverse().find((row) => row.weightKg !== null)?.weightKg ?? null;
  const latestWaist = [...measurements].reverse().find((row) => row.waistCm !== null)?.waistCm ?? null;
  const latestBodyFat = [...measurements].reverse().find((row) => row.bodyFatPercent !== null)?.bodyFatPercent ?? null;
  const weightChange = weightRows.length >= 2
    ? (weightRows.at(-1)?.weightKg ?? 0) - (weightRows[0]?.weightKg ?? 0)
    : null;
  const minWeight = weightRows.length ? Math.min(...weightRows.map((row) => row.weightKg ?? 0)) : 0;
  const maxWeight = weightRows.length ? Math.max(...weightRows.map((row) => row.weightKg ?? 0)) : 0;
  const weightRange = Math.max(0.5, maxWeight - minWeight);

  async function saveMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const weightKg = parseOptionalPositive(weight);
    const waistCm = parseOptionalPositive(waist);
    const bodyFatPercent = parseOptionalPercent(bodyFat);
    const cleanNote = note.trim().slice(0, 1000) || null;
    if (weightKg === undefined || waistCm === undefined || bodyFatPercent === undefined) {
      setError('مقادیر عددی را درست وارد کن؛ درصد چربی باید بین ۰ تا ۱۰۰ باشد.');
      return;
    }
    if (weightKg === null && waistCm === null && bodyFatPercent === null) {
      setError('حداقل یکی از وزن، دور کمر یا درصد چربی را وارد کن.');
      return;
    }

    setSaving(true);
    setError('');
    const local = createLocalMeasurement({ localDate, weightKg, waistCm, bodyFatPercent, note: cleanNote });

    if (!account) {
      const next = [...measurements, local].slice(-500);
      try {
        writeLocalBodyMeasurements(next);
        setMeasurements(next);
        setWeight(''); setWaist(''); setBodyFat(''); setNote('');
      } catch {
        setError('ذخیره اندازه‌گیری روی این مرورگر ممکن نشد.');
      } finally {
        setSaving(false);
      }
      return;
    }

    const supabase = createMeasurementClient();
    const { data, error: insertError } = await supabase
      .from('body_measurements')
      .insert({
        user_id: account.id,
        client_mutation_id: local.clientMutationId,
        local_date: local.localDate,
        measured_at: local.measuredAt,
        weight_kg: local.weightKg,
        waist_cm: local.waistCm,
        body_fat_percent: local.bodyFatPercent,
        note: local.note,
      })
      .select('*')
      .single();
    if (insertError || !data) {
      setError('ذخیره اندازه‌گیری در حساب انجام نشد.');
      setSaving(false);
      return;
    }

    setMeasurements((current) => [...current, rowToBodyMeasurement(data)].slice(-180));
    setWeight(''); setWaist(''); setBodyFat(''); setNote('');
    setSaving(false);
  }

  async function deleteMeasurement(row: BodyMeasurement) {
    if (!window.confirm('این اندازه‌گیری حذف شود؟')) return;
    setError('');
    if (!account) {
      const next = measurements.filter((item) => item.id !== row.id);
      try { writeLocalBodyMeasurements(next); setMeasurements(next); }
      catch { setError('حذف داده محلی انجام نشد.'); }
      return;
    }
    const supabase = createMeasurementClient();
    const { error: deleteError } = await supabase
      .from('body_measurements')
      .delete()
      .eq('user_id', account.id)
      .eq('id', row.id);
    if (deleteError) setError('حذف اندازه‌گیری از حساب انجام نشد.');
    else setMeasurements((current) => current.filter((item) => item.id !== row.id));
  }

  return (
    <section className="page-stack" aria-labelledby="progress-heading">
      <div className="section-heading">
        <div><p className="section-kicker">دادهٔ واقعی</p><h2 id="progress-heading">پیشرفت</h2></div>
        <span className="progress-period">{account ? 'حساب همگام' : 'همین مرورگر'}</span>
      </div>

      <div className="progress-metrics">
        <article><span>آخرین وزن</span>{metric(latestWeight, 'کیلوگرم')}<p>{weightChange === null ? 'برای روند، حداقل دو ثبت لازم است' : `${faNumber.format(Math.abs(weightChange))} کیلوگرم ${weightChange < 0 ? 'کاهش' : weightChange > 0 ? 'افزایش' : 'بدون تغییر'}`}</p></article>
        <article><span>آخرین دور کمر</span>{metric(latestWaist, 'سانتی‌متر')}<p>{latest ? `آخرین ثبت: ${dateFormatter.format(new Date(latest.measuredAt))}` : 'هنوز اندازه‌گیری ثبت نشده'}</p></article>
        <article><span>درصد چربی بدن</span>{metric(latestBodyFat, '٪')}<p>{faNumber.format(measurements.length)} ثبت واقعی</p></article>
      </div>

      <article className="progress-chart-card">
        <div className="progress-chart-card__header">
          <div><span>روند وزن</span><h3>{weightRows.length ? 'آخرین اندازه‌گیری‌های ثبت‌شده' : 'هنوز داده‌ای برای نمودار نیست'}</h3></div>
          {weightChange === null ? <b>—</b> : <b>{weightChange > 0 ? '+' : ''}{faNumber.format(weightChange)} kg</b>}
        </div>
        {loading ? <p className="progress-empty">در حال خواندن اندازه‌گیری‌ها...</p> : weightRows.length ? (
          <div className="weight-bars" aria-label="روند وزن ثبت‌شده" style={{ gridTemplateColumns: `repeat(${weightRows.length}, minmax(0, 1fr))` }}>
            {weightRows.map((row) => {
              const normalized = ((row.weightKg ?? minWeight) - minWeight) / weightRange;
              const height = 38 + normalized * 62;
              return <div className="weight-bar" key={row.id}><span className="weight-bar__value">{faNumber.format(row.weightKg ?? 0)}</span><i style={{ blockSize: `${height}%` }} /><small>{dateFormatter.format(new Date(row.measuredAt))}</small></div>;
            })}
          </div>
        ) : <p className="progress-empty">اولین وزن را پایین ثبت کن؛ NeoFit هیچ روند شخصی را از خودش نمی‌سازد.</p>}
      </article>

      <form className="measurement-form" onSubmit={saveMeasurement}>
        <div className="section-heading section-heading--compact"><div><p className="section-kicker">ثبت جدید</p><h2>اندازه‌گیری بدن</h2></div><span className="count-badge">{localDate}</span></div>
        <div className="measurement-grid">
          <label>وزن (kg)<input type="number" step="0.1" min="0.1" max="1000" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="مثلاً 82.4" /></label>
          <label>دور کمر (cm)<input type="number" step="0.1" min="0.1" max="500" value={waist} onChange={(event) => setWaist(event.target.value)} placeholder="مثلاً 91" /></label>
          <label>درصد چربی (%)<input type="number" step="0.1" min="0" max="100" value={bodyFat} onChange={(event) => setBodyFat(event.target.value)} placeholder="اختیاری" /></label>
        </div>
        <label className="measurement-note">یادداشت<input maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="مثلاً صبح، ناشتا" /></label>
        {error ? <p className="measurement-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : account ? 'ذخیره در حساب' : 'ذخیره روی این دستگاه'}</button>
      </form>

      <article className="consistency-card">
        <div className="consistency-card__copy"><span>تغذیه امروز</span><h3>{faNumber.format(summary.entryCount)} وعده ثبت شده</h3><p>{faNumber.format(summary.macros.calories)} کیلوکالری از داده‌های واقعی دفترچه امروز.</p></div>
      </article>

      {measurements.length ? <section className="measurement-history" aria-labelledby="measurement-history-heading"><div className="section-heading section-heading--compact"><div><p className="section-kicker">تاریخچه</p><h2 id="measurement-history-heading">آخرین ثبت‌ها</h2></div></div>{[...measurements].reverse().slice(0, 6).map((row) => <article key={row.id}><div><strong>{dateFormatter.format(new Date(row.measuredAt))}</strong><p>{[row.weightKg !== null ? `${faNumber.format(row.weightKg)} kg` : null, row.waistCm !== null ? `${faNumber.format(row.waistCm)} cm کمر` : null, row.bodyFatPercent !== null ? `${faNumber.format(row.bodyFatPercent)}٪ چربی` : null].filter(Boolean).join(' · ')}</p>{row.note ? <small>{row.note}</small> : null}</div><button type="button" onClick={() => void deleteMeasurement(row)}>حذف</button></article>)}</section> : null}

      <p className="progress-demo-note">این صفحه دیگر وزن یا روند ساختگی نمایش نمی‌دهد. مقادیر بالا فقط از ثبت‌های همین کاربر یا همین مرورگر می‌آیند.</p>
    </section>
  );
}
