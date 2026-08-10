'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_AI_MODELS } from '@/lib/ai/config';
import type { AiCredentialMetadata, AiProvider } from '@/lib/ai/types';

type OnboardingMode = 'loading' | 'account' | 'guest' | 'error';

interface ProviderState {
  readonly apiKey: string;
  readonly busy: boolean;
  readonly message: string;
  readonly error: boolean;
}

const emptyProviderState: ProviderState = { apiKey: '', busy: false, message: '', error: false };

function SecretField({
  id,
  value,
  placeholder,
  disabled,
  revealed,
  onRevealChange,
  onChange,
}: {
  readonly id: string;
  readonly value: string;
  readonly placeholder: string;
  readonly disabled: boolean;
  readonly revealed: boolean;
  readonly onRevealChange: (next: boolean) => void;
  readonly onChange: (next: string) => void;
}) {
  return (
    <div className="onboarding-secret-field">
      <input
        id={id}
        type={revealed ? 'text' : 'password'}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={`${id}-privacy`}
      />
      <button
        type="button"
        className="onboarding-secret-field__toggle"
        onClick={() => onRevealChange(!revealed)}
        disabled={disabled || !value}
        aria-pressed={revealed}
        aria-label={revealed ? 'پنهان کردن کلید' : 'نمایش کلید'}
      >
        {revealed ? 'پنهان' : 'نمایش'}
      </button>
    </div>
  );
}

export function OnboardingAiGate({
  mode,
  onReadyChange,
}: {
  readonly mode: OnboardingMode;
  readonly onReadyChange: (ready: boolean) => void;
}) {
  const [credentials, setCredentials] = useState<AiCredentialMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [google, setGoogle] = useState<ProviderState>(emptyProviderState);
  const [avalai, setAvalai] = useState<ProviderState>(emptyProviderState);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showAvalaiKey, setShowAvalaiKey] = useState(false);

  const googleCredential = useMemo(
    () => credentials.find((credential) => credential.provider === 'google') ?? null,
    [credentials],
  );
  const avalaiCredential = useMemo(
    () => credentials.find((credential) => credential.provider === 'avalai') ?? null,
    [credentials],
  );
  const googleReady = mode === 'account' && googleCredential?.status === 'active';
  const avalaiReady = mode === 'account' && avalaiCredential?.status === 'active';
  const gateReady = mode === 'guest' ? true : avalaiReady;

  useEffect(() => {
    onReadyChange(gateReady);
  }, [gateReady, onReadyChange]);

  useEffect(() => {
    if (mode !== 'account') {
      setLoading(false);
      return;
    }
    let alive = true;
    async function loadCredentials() {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/providers', { cache: 'no-store' });
        if (!response.ok) throw new Error('provider_load_failed');
        const body = await response.json() as { providers?: AiCredentialMetadata[] };
        if (alive) setCredentials(body.providers ?? []);
      } catch {
        if (alive) setAvalai((current) => ({ ...current, error: true, message: 'خواندن وضعیت کلیدهای AI ممکن نشد.' }));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadCredentials();
    return () => { alive = false; };
  }, [mode]);

  function patch(provider: AiProvider, next: Partial<ProviderState>) {
    if (provider === 'google') setGoogle((current) => ({ ...current, ...next }));
    else setAvalai((current) => ({ ...current, ...next }));
  }

  function upsertMetadata(metadata: AiCredentialMetadata) {
    setCredentials((current) => [
      ...current.filter((item) => item.provider !== metadata.provider),
      metadata,
    ]);
  }

  async function save(provider: AiProvider) {
    const state = provider === 'google' ? google : avalai;
    const apiKey = state.apiKey.trim();
    if (!apiKey) {
      patch(provider, { error: true, message: 'API key را وارد کن.' });
      return;
    }

    patch(provider, { busy: true, error: false, message: 'در حال اعتبارسنجی و ذخیره امن...' });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, modelId: DEFAULT_AI_MODELS[provider] }),
      });
      const body = await response.json() as AiCredentialMetadata & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'credential_save_failed');
      upsertMetadata(body);
      patch(provider, {
        apiKey: '',
        busy: false,
        error: false,
        message: provider === 'google'
          ? (avalaiReady
            ? 'Google معتبر است؛ درخواست‌های معمول ابتدا از Google و در خطای مجاز از AvalAI می‌روند.'
            : 'Google معتبر است؛ برای ادامه باید AvalAI معتبر را هم متصل کنی.')
          : (googleReady
            ? 'AvalAI معتبر است؛ Google اصلی و AvalAI fallback آماده‌اند.'
            : 'AvalAI معتبر است؛ می‌توانی ادامه بدهی.'),
      });
      if (provider === 'google') setShowGoogleKey(false);
      else setShowAvalaiKey(false);
    } catch {
      patch(provider, {
        busy: false,
        error: true,
        message: provider === 'google'
          ? 'کلید Google معتبر نشد یا Provider در دسترس نبود.'
          : 'کلید AvalAI معتبر نشد یا Provider در دسترس نبود.',
      });
    }
  }

  async function retest(provider: AiProvider) {
    patch(provider, { busy: true, error: false, message: 'در حال تست اتصال بدون inference...' });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, { method: 'POST' });
      const body = await response.json() as AiCredentialMetadata & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'credential_test_failed');
      upsertMetadata(body);
      patch(provider, { busy: false, error: false, message: 'اتصال سالم است.' });
    } catch {
      patch(provider, { busy: false, error: true, message: 'تست اتصال ناموفق بود.' });
    }
  }

  if (mode === 'loading') {
    return <div className="onboarding-ai-gate is-loading" aria-busy="true">در حال بررسی حساب و کلید AI...</div>;
  }

  if (mode === 'error') {
    return <div className="onboarding-ai-gate is-error" role="alert">اتصال حساب در دسترس نیست؛ کلید AI تا بازگشت اتصال ذخیره نمی‌شود.</div>;
  }

  if (mode === 'guest') {
    return (
      <div className="onboarding-ai-gate">
        <div className="onboarding-ai-gate__status is-demo"><strong>حالت Demo</strong><span>کلید AI در حالت مهمان دریافت یا ذخیره نمی‌شود.</span></div>
        <p>می‌توانی تجربه Onboarding را ببینی، اما دوره AI شخصی فقط برای حساب واقعی ساخته می‌شود.</p>
        <a className="onboarding-ai-gate__auth-link" href="/auth">ورود یا ساخت حساب</a>
      </div>
    );
  }

  const connectionTitle = avalaiReady
    ? (googleReady ? 'Google + AvalAI آماده‌اند' : 'AvalAI متصل است؛ آماده ادامه‌ای')
    : (googleReady ? 'Google متصل است؛ AvalAI را هم اضافه کن' : 'AvalAI را برای ادامه متصل کن');
  const connectionDetail = avalaiReady
    ? (googleReady
      ? 'درخواست‌های معمول ابتدا به Google می‌روند و AvalAI fallback معتبر باقی می‌ماند.'
      : 'NeoFit می‌تواند مستقیماً از AvalAI استفاده کند؛ Google برای ادامه اجباری نیست.')
    : (googleReady
      ? 'Google به‌تنهایی شرط عبور نیست؛ AvalAI برای پوشش محدودیت مصرف یا خطای مجاز لازم است.'
      : 'یک AvalAI معتبر برای عبور کافی است. اگر Google را هم اضافه کنی، Google مسیر اول می‌شود.');

  return (
    <div className="onboarding-ai-gate">
      <div className={`onboarding-ai-gate__status ${gateReady ? 'is-ready' : ''}`} aria-live="polite">
        <strong>{connectionTitle}</strong>
        <span>{connectionDetail}</span>
      </div>

      <div className="onboarding-ai-gate__provider">
        <div className="onboarding-ai-gate__provider-head">
          <div><strong>۱. AvalAI را متصل کن</strong><span>برای ادامه Onboarding همین کلید به‌تنهایی کافی است و fallback پایدار NeoFit را هم فراهم می‌کند.</span></div>
          <a href="https://docs.avalai.ir/en/quickstart" target="_blank" rel="noreferrer">راهنمای رسمی ↗</a>
        </div>
        {avalaiReady ? (
          <>
            <div className="onboarding-ai-gate__status is-ready"><strong>AvalAI متصل است</strong><span>{avalaiCredential?.keyHint ?? ''} · {avalaiCredential?.modelId ?? DEFAULT_AI_MODELS.avalai}</span></div>
            <div className="onboarding-ai-gate__actions">
              <button type="button" className="is-secondary" onClick={() => void retest('avalai')} disabled={avalai.busy}>{avalai.busy ? 'در حال تست...' : 'تست دوباره AvalAI'}</button>
            </div>
          </>
        ) : (
          <>
            <label htmlFor="onboarding-avalai-key">AvalAI API key</label>
            <SecretField
              id="onboarding-avalai-key"
              value={avalai.apiKey}
              placeholder="کلید شخصی AvalAI"
              disabled={avalai.busy || loading}
              revealed={showAvalaiKey}
              onRevealChange={setShowAvalaiKey}
              onChange={(apiKey) => setAvalai((current) => ({ ...current, apiKey, message: '', error: false }))}
            />
            <small id="onboarding-avalai-key-privacy" className="onboarding-ai-gate__field-help">کلید بعد از Save از فیلد پاک می‌شود و از API NeoFit برنمی‌گردد.</small>
            <div className="onboarding-ai-gate__actions">
              <button type="button" onClick={() => void save('avalai')} disabled={avalai.busy || loading || !avalai.apiKey.trim()}>{avalai.busy ? 'در حال بررسی...' : 'اعتبارسنجی و ذخیره AvalAI'}</button>
            </div>
          </>
        )}
        {avalai.message ? <p className={avalai.error ? 'is-error' : 'is-success'} role="status">{avalai.message}</p> : null}
      </div>

      <details className="onboarding-ai-gate__fallback">
        <summary>Google AI Studio — اختیاری</summary>
        <p>اگر Google را هم متصل کنی، درخواست‌های معمول اول به Google می‌روند؛ AvalAI شرط عبور و fallback معتبر باقی می‌ماند. بعضی قابلیت‌های وابسته به ویدیوی YouTube ممکن است بعداً Google بخواهند.</p>
        {googleReady ? (
          <>
            <div className="onboarding-ai-gate__status is-ready"><strong>Google Gemini متصل است</strong><span>{googleCredential?.keyHint ?? ''} · {googleCredential?.modelId ?? DEFAULT_AI_MODELS.google}</span></div>
            <div className="onboarding-ai-gate__actions">
              <button type="button" className="is-secondary" onClick={() => void retest('google')} disabled={google.busy}>{google.busy ? 'در حال تست...' : 'تست دوباره Google'}</button>
            </div>
          </>
        ) : (
          <div className="onboarding-ai-gate__provider">
            <div className="onboarding-ai-gate__provider-head">
              <div><strong>کلید Google داری؟</strong><span>Google اختیاری است؛ بدون AvalAI به‌تنهایی اجازه عبور نمی‌دهد.</span></div>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">باز کردن AI Studio ↗</a>
            </div>
            <label htmlFor="onboarding-google-key">Google API key</label>
            <SecretField
              id="onboarding-google-key"
              value={google.apiKey}
              placeholder="کلید شخصی Google"
              disabled={google.busy || loading}
              revealed={showGoogleKey}
              onRevealChange={setShowGoogleKey}
              onChange={(apiKey) => setGoogle((current) => ({ ...current, apiKey, message: '', error: false }))}
            />
            <small id="onboarding-google-key-privacy" className="onboarding-ai-gate__field-help">کلید بعد از Save از فیلد پاک می‌شود و از API NeoFit برنمی‌گردد.</small>
            <div className="onboarding-ai-gate__actions"><button type="button" className="is-secondary" onClick={() => void save('google')} disabled={google.busy || loading || !google.apiKey.trim()}>{google.busy ? 'در حال بررسی...' : 'اعتبارسنجی و ذخیره Google'}</button></div>
          </div>
        )}
        {google.message ? <p className={google.error ? 'is-error' : 'is-success'} role="status">{google.message}</p> : null}
      </details>

      <p className="onboarding-ai-gate__privacy">Raw key فقط در state موقت همین فرم است؛ داخل JSON آنبوردینگ، حافظه ماندگار مرورگر، log یا analytics ذخیره نمی‌شود.</p>
    </div>
  );
}
