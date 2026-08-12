'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { WorkoutDay } from '@/data/workout-fixtures';
import {
  cancelAccountWorkout,
  completeAccountWorkout,
  loadOrCreateAccountWorkout,
  persistAccountWorkoutSet,
} from '@/lib/workout-persistence';
import {
  clearGuestWorkout,
  completeWorkoutSet,
  completedSetCount,
  createWorkoutPlayerState,
  currentWorkoutPosition,
  loadGuestWorkout,
  parsePositiveReps,
  parseWeightKg,
  persistGuestWorkout,
  restSeconds,
  saveGuestWorkoutHistory,
  updateWorkoutSetDraft,
  workoutVolumeKg,
  type WorkoutPlayerState,
} from '@/lib/workout-session';

const fa = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

export function WorkoutPlayer({ workout, userId }: { workout: WorkoutDay; userId: string | null }) {
  const [state, setState] = useState<WorkoutPlayerState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [rpe, setRpe] = useState(7);
  const [painScale, setPainScale] = useState(0);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    async function boot() {
      setLoading(true);
      setMessage('');
      try {
        if (userId) {
          const remote = await loadOrCreateAccountWorkout(userId, workout);
          if (!active) return;
          setState(remote.player);
          setSessionId(remote.sessionId);
        } else {
          const guest = loadGuestWorkout(workout) ?? createWorkoutPlayerState(workout);
          if (!active) return;
          setState(guest);
          persistGuestWorkout(guest);
        }
      } catch {
        if (active) setMessage('آماده‌سازی جلسه تمرین ممکن نشد. دوباره تلاش کن.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void boot();
    return () => { active = false; };
  }, [userId, workout]);

  useEffect(() => {
    if (restRemaining === null || restRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setRestRemaining((value) => value === null ? null : Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restRemaining]);

  const position = state ? currentWorkoutPosition(workout, state) : null;
  const currentExercise = position ? workout.exercises[position.exerciseIndex] : null;
  const currentSet = position && state
    ? state.sets.find((set) => set.exerciseOrder === position.exerciseIndex + 1 && set.setOrder === position.setIndex + 1) ?? null
    : null;
  const totalSets = useMemo(
    () => workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
    [workout],
  );
  const completeSets = state ? completedSetCount(state) : 0;
  const volume = state ? workoutVolumeKg(state) : 0;

  function patchDraft(patch: { reps?: string; weightKg?: string }) {
    if (!state || !position) return;
    const next = updateWorkoutSetDraft(state, position, patch);
    setState(next);
    if (!userId) persistGuestWorkout(next);
    setMessage('');
  }

  async function saveCurrentSet() {
    if (!state || !position || !currentExercise || !currentSet || busy) return;
    const reps = parsePositiveReps(currentSet.reps);
    const weight = parseWeightKg(currentSet.weightKg);
    if (reps === null || weight === null) {
      setMessage('تکرار باید حداقل ۱ و وزنه یک عدد صفر یا بیشتر باشد.');
      return;
    }

    setBusy(true);
    setMessage('');
    const next = completeWorkoutSet(state, position);
    try {
      if (userId) {
        if (!sessionId) throw new Error('missing_session');
        await persistAccountWorkoutSet({ userId, sessionId, state: next, position });
      } else {
        persistGuestWorkout(next);
      }
      setState(next);
      const nextPosition = currentWorkoutPosition(workout, next);
      if (nextPosition) setRestRemaining(restSeconds(currentExercise.rest));
    } catch {
      setMessage('ذخیره ست انجام نشد؛ برای جلوگیری از گم‌شدن داده به ست بعد نرفتیم.');
    } finally {
      setBusy(false);
    }
  }

  async function cancelSession() {
    if (!state || busy || !window.confirm('این جلسه لغو شود؟')) return;
    setBusy(true);
    try {
      if (userId && sessionId) await cancelAccountWorkout(userId, sessionId);
      if (!userId) clearGuestWorkout(workout.id);
      window.location.assign('/workout');
    } catch {
      setMessage('لغو جلسه انجام نشد.');
      setBusy(false);
    }
  }

  async function finishSession() {
    if (!state || busy) return;
    const completedAt = new Date().toISOString();
    const durationMinutes = Math.min(1440, Math.max(1, Math.round((Date.parse(completedAt) - Date.parse(state.startedAt)) / 60000)));
    const totalVolumeKg = Math.round(workoutVolumeKg(state) * 100) / 100;
    setBusy(true);
    setMessage('');
    try {
      if (userId) {
        if (!sessionId) throw new Error('missing_session');
        await completeAccountWorkout({
          userId,
          sessionId,
          completedAt,
          durationMinutes,
          rpe,
          painScale,
          notes: notes.trim(),
          totalVolumeKg,
        });
      } else {
        saveGuestWorkoutHistory({
          clientMutationId: state.clientMutationId,
          workoutId: workout.id,
          workoutTitle: workout.title,
          startedAt: state.startedAt,
          completedAt,
          durationMinutes,
          totalVolumeKg,
          rpe,
          painScale,
          notes: notes.trim(),
          setCount: completedSetCount(state),
        });
        clearGuestWorkout(workout.id);
      }
      setSaved(true);
    } catch {
      setMessage('ذخیره نهایی تمرین انجام نشد. دوباره تلاش کن.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="workout-player-frame"><section className="workout-player-card is-loading" aria-busy="true">در حال آماده‌سازی تمرین…</section></main>;
  }

  if (!state) {
    return <main className="workout-player-frame"><section className="workout-player-card"><h1>تمرین آماده نشد</h1><p>{message}</p><Link href="/workout">بازگشت به تمرین‌ها</Link></section></main>;
  }

  if (saved) {
    return (
      <main className="workout-player-frame">
        <section className="workout-player-card workout-finished">
          <span className="workout-finished__mark">✓</span>
          <p className="workout-player-kicker">تمرین ثبت شد</p>
          <h1>{workout.title}</h1>
          <div className="workout-finished__stats">
            <div><strong>{fa.format(completeSets)}</strong><span>ست</span></div>
            <div><strong>{fa.format(Math.round(volume))}</strong><span>kg حجم</span></div>
            <div><strong>{fa.format(rpe)}</strong><span>سختی</span></div>
          </div>
          <p>تمرینت ذخیره شد و در روند پیشرفتت قابل استفاده است.</p>
          <Link className="workout-player-primary" href="/workout">تمام</Link>
        </section>
      </main>
    );
  }

  if (!position || !currentExercise || !currentSet) {
    return (
      <main className="workout-player-frame">
        <section className="workout-player-card workout-completion-card">
          <p className="workout-player-kicker">همه ست‌ها انجام شدند</p>
          <h1>تمرین چطور بود؟</h1>
          <div className="workout-completion-summary">
            <div><span>ست انجام‌شده</span><strong>{fa.format(completeSets)}</strong></div>
            <div><span>حجم کل</span><strong>{fa.format(Math.round(volume))} kg</strong></div>
          </div>

          <label htmlFor="workout-rpe">سختی تمرین <b>{fa.format(rpe)} / ۱۰</b></label>
          <input id="workout-rpe" type="range" min="1" max="10" value={rpe} onChange={(event) => setRpe(Number(event.target.value))} />
          <label htmlFor="workout-pain">درد یا ناراحتی غیرعادی <b>{fa.format(painScale)} / ۱۰</b></label>
          <input id="workout-pain" type="range" min="0" max="10" value={painScale} onChange={(event) => setPainScale(Number(event.target.value))} />
          {painScale >= 4 ? <p className="workout-player-warning">درد متوسط یا بیشتر ثبت کرده‌ای. اگر درد ادامه دارد، تمرین را متوقف کن و در صورت نیاز با متخصص مشورت کن.</p> : null}
          <label htmlFor="workout-notes">یادداشت</label>
          <textarea id="workout-notes" maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="مثلاً انرژی کم بود یا یک حرکت سخت‌تر بود" />
          {message ? <p className="workout-player-error" role="status">{message}</p> : null}
          <button className="workout-player-primary" type="button" disabled={busy} onClick={() => void finishSession()}>{busy ? 'در حال ذخیره…' : 'ثبت تمرین'}</button>
          <button className="workout-player-link-button" type="button" disabled={busy} onClick={() => void cancelSession()}>لغو</button>
        </section>
      </main>
    );
  }

  if (restRemaining !== null && restRemaining > 0) {
    return (
      <main className="workout-player-frame">
        <section className="workout-player-card workout-rest-card">
          <p className="workout-player-kicker">استراحت</p>
          <strong>{fa.format(restRemaining)}</strong>
          <span>ثانیه</span>
          <p>بعدی: {workout.exercises[currentWorkoutPosition(workout, state)?.exerciseIndex ?? position.exerciseIndex]?.name}</p>
          <button className="workout-player-primary" type="button" onClick={() => setRestRemaining(0)}>ادامه</button>
        </section>
      </main>
    );
  }

  const exerciseCompleted = state.sets.filter((set) => set.exerciseOrder === position.exerciseIndex + 1 && set.completedAt);
  const progress = totalSets ? Math.round((completeSets / totalSets) * 100) : 0;

  return (
    <main className="workout-player-frame">
      <section className="workout-player-card">
        <header className="workout-player-header">
          <Link href="/workout">خروج</Link>
          <div><span>{fa.format(completeSets)} / {fa.format(totalSets)} ست</span><b>{fa.format(progress)}٪</b></div>
        </header>
        <div className="workout-player-progress"><span style={{ inlineSize: `${progress}%` }} /></div>

        <div className="workout-player-heading">
          <p className="workout-player-kicker">حرکت {fa.format(position.exerciseIndex + 1)} از {fa.format(workout.exercises.length)}</p>
          <h1>{currentSet.exerciseName}</h1>
          <p>{fa.format(currentExercise.sets)} ست × {currentExercise.reps} تکرار · {currentExercise.rest} استراحت</p>
        </div>

        <div className="workout-player-set-number">ست {fa.format(position.setIndex + 1)}</div>
        <div className="workout-player-inputs">
          <label>وزنه <span>kg</span><input inputMode="decimal" type="number" min="0" max="10000" step="0.5" value={currentSet.weightKg} onChange={(event) => patchDraft({ weightKg: event.target.value })} /></label>
          <label>تکرار<input inputMode="numeric" type="number" min="1" max="1000" placeholder={currentSet.targetReps} value={currentSet.reps} onChange={(event) => patchDraft({ reps: event.target.value })} /></label>
        </div>

        {exerciseCompleted.length ? (
          <div className="workout-player-set-history">
            <span>ست‌های قبلی این حرکت</span>
            {exerciseCompleted.map((set) => <div key={`${set.exerciseOrder}:${set.setOrder}`}><b>{fa.format(set.setOrder)}</b><span>{set.weightKg} kg</span><span>{set.reps} تکرار</span></div>)}
          </div>
        ) : null}

        {message ? <p className="workout-player-error" role="status">{message}</p> : null}
        <button className="workout-player-primary workout-player-save-set" type="button" disabled={busy || !currentSet.reps || !currentSet.weightKg} onClick={() => void saveCurrentSet()}>{busy ? 'در حال ذخیره…' : 'ثبت ست'}</button>
        <button className="workout-player-link-button" type="button" disabled={busy} onClick={() => void cancelSession()}>لغو تمرین</button>
      </section>
    </main>
  );
}
