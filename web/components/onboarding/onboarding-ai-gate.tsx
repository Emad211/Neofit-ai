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
  const providerReady = googleReady || avalaiReady;
  const gateReady = mode === 'guest' ? true : providerReady;

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
        if (alive) setAvalai((current) => ({ ...current, error: true, message: 'وضعیت اتصال بارگذاری نشد. دوباره تلاش کن.' }));
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
      patch(provider, { error: true, message: 'کلید را وارد کن.' });
      return;
    }

    patch(provider, { busy: true, error: false, message: 'در حال بررسی اتصال...' });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, modelId: DEFAULT_AI_MODELS[provider] }),
      });
      const body = await response.json() as AiCredentialMetadata & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'credential_save_failed');
      upsertMetadata(body);
      patch(provider, { apiKey: '', busy: false, error: false, message: 'اتصال آماده است.' });
      if (provider === 'google') setShowGoogleKey(false);
      else setShowAvalaiKey(false);
    } catch {
      patch(provider, {
        busy: false,
        error: true,
        message: `اتصال ${provider === 'google' ? 'Google' : 'AvalAI'} برقرار نشد. کلید را بررسی کن و دوباره تلاش کن.`,
      });
    }
  }

  async function retest(provider: AiProvider) {
    patch(provider, { busy: true, error: false, message: 'در حال بررسی اتصال...' });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, { method: 'POST' });
      const body = await response.json() as AiCredentialMetadata & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'credential_test_failed');
      upsertMetadata(body);
      patch(provider, { busy: false, error: false, message: 'اتصال سالم است.' });
    } catch {
      patch(provider, { busy: false, error: true, message: 'اتصال برقرار نشد. دوباره تلاش کن.' });
    }
  }

  if (mode === 'loading') {
    return <div className="onboarding-ai-gate is-loading" aria-busy="true">در حال بررسی اتصال مربی هوشمند...</div>;
  }

  if (mode === 'error') {
    return <div className="onboarding-ai-gate is-error" role="alert">اتصال حساب در دسترس نیست. صفحه را تازه کن و دوباره تلاش کن.</div>;
  }

  if (mode === 'guest') {
    return (
      <div className="onboarding-ai-gate">
        <div className="onboarding-ai-gate__status"><strong>برای ادامه وارد حساب شو</strong><span>برنامه شخصی و تنظیمات مربی هوشمند فقط برای حساب ذخیره می‌شوند.</span></div>
        <a className="onboarding-ai-gate__auth-link" href="/auth">ورود یا ساخت حساب</a>
      </div>
    );
  }

  if (providerReady) {
    return (
      <div className="onboarding-ai-gate">
        <div className="onboarding-ai-gate__status is-ready" aria-live="polite">
          <strong>مربی هوشمند آماده است</strong>
          <span>{[googleReady ? 'Google Gemini' : null, avalaiReady ? 'AvalAI' : null].filter(Boolean).join(' و ')} متصل است.</span>
        </div>
        <div className="onboarding-ai-gate__actions">
          {googleReady ? <button type="button" className="is-secondary" onClick={() => void retest('google')} disabled={google.busy}>{google.busy ? 'در حال بررسی...' : 'بررسی Google'}</button> : null}
          {avalaiReady ? <button type="button" className="is-secondary" onClick={() => void retest('avalai')} disabled={avalai.busy}>{avalai.busy ? 'در حال بررسی...' : 'بررسی AvalAI'}</button> : null}
          <a className="onboarding-ai-gate__manage-link" href="/profile/ai">مدیریت اتصال‌ها</a>
        </div>
        {google.message ? <p className={google.error ? 'is-error' : 'is-success'} role="status">{google.message}</p> : null}
        {avalai.message ? <p className={avalai.error ? 'is-error' : 'is-success'} role="status">{avalai.message}</p> : null}
      </div>
    );
  }

  return (
    <div className="onboarding-ai-gate">
      <div className="onboarding-ai-gate__status" aria-live="polite">
        <strong>یک سرویس هوش مصنوعی را وصل کن</strong>
        <span>برای ساخت برنامه و استفاده از مربی، اتصال Google یا AvalAI کافی است.</span>
      </div>

      <div className="onboarding-ai-gate__provider">
        <div className="onboarding-ai-gate__provider-head">
          <div><strong>AvalAI</strong><span>کلید حساب AvalAI خودت را وارد کن.</span></div>
          <a href="https://docs.avalai.ir/en/quickstart" target="_blank" rel="noreferrer">راهنمای دریافت کلید ↗</a>
        </div>
        <label htmlFor="onboarding-avalai-key">کلید AvalAI</label>
        <SecretField
          id="onboarding-avalai-key"
          value={avalai.apiKey}
          placeholder="کلید شخصی AvalAI"
          disabled={avalai.busy || loading}
          revealed={showAvalaiKey}
          onRevealChange={setShowAvalaiKey}
          onChange={(apiKey) => setAvalai((current) => ({ ...current, apiKey, message: '', error: false }))}
        />
        <small id="onboarding-avalai-key-privacy" className="onboarding-ai-gate__field-help">کلید پس از ذخیره دوباره در صفحه نمایش داده نمی‌شود.</small>
        <div className="onboarding-ai-gate__actions">
          <button type="button" onClick={() => void save('avalai')} disabled={avalai.busy || loading || !avalai.apiKey.trim()}>{avalai.busy ? 'در حال بررسی...' : 'اتصال AvalAI'}</button>
        </div>
        {avalai.message ? <p className={avalai.error ? 'is-error' : 'is-success'} role="status">{avalai.message}</p> : null}
      </div>

      <details className="onboarding-ai-gate__fallback">
        <summary>یا Google Gemini را وصل کن</summary>
        <div className="onboarding-ai-gate__provider">
          <div className="onboarding-ai-gate__provider-head">
            <div><strong>Google Gemini</strong><span>کلید Google AI Studio خودت را وارد کن.</span></div>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">دریافت کلید ↗</a>
          </div>
          <label htmlFor="onboarding-google-key">کلید Google</label>
          <SecretField
            id="onboarding-google-key"
            value={google.apiKey}
            placeholder="کلید شخصی Google"
            disabled={google.busy || loading}
            revealed={showGoogleKey}
            onRevealChange={setShowGoogleKey}
            onChange={(apiKey) => setGoogle((current) => ({ ...current, apiKey, message: '', error: false }))}
          />
          <small id="onboarding-google-key-privacy" className="onboarding-ai-gate__field-help">کلید پس از ذخیره دوباره در صفحه نمایش داده نمی‌شود.</small>
          <div className="onboarding-ai-gate__actions"><button type="button" className="is-secondary" onClick={() => void save('google')} disabled={google.busy || loading || !google.apiKey.trim()}>{google.busy ? 'در حال بررسی...' : 'اتصال Google'}</button></div>
        </div>
        {google.message ? <p className={google.error ? 'is-error' : 'is-success'} role="status">{google.message}</p> : null}
      </details>
    </div>
  );
}
