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
  onGoogleReadyChange,
}: {
  readonly mode: OnboardingMode;
  readonly onGoogleReadyChange: (ready: boolean) => void;
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

  useEffect(() => {
    onGoogleReadyChange(mode === 'guest' ? true : googleReady);
  }, [googleReady, mode, onGoogleReadyChange]);

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
        if (alive) setGoogle((current) => ({ ...current, error: true, message: 'خواندن وضعیت کلیدهای AI ممکن نشد.' }));
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
          ? 'Google معتبر است؛ می‌توانی ادامه بدهی.'
          : 'AvalAI به‌عنوان fallback ذخیره شد.',
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

  return (
    <div className="onboarding-ai-gate">
      <div className={`onboarding-ai-gate__status ${googleReady ? 'is-ready' : ''}`}>
        <strong>{googleReady ? 'Google Gemini متصل است' : 'Google AI Studio را متصل کن'}</strong>
        <span>{googleReady ? `${googleCredential?.keyHint ?? ''} · ${googleCredential?.modelId ?? DEFAULT_AI_MODELS.google}` : 'کلید شخصی خودت را می‌سازی؛ NeoFit فقط بعد از اعتبارسنجی آن را رمزنگاری می‌کند.'}</span>
      </div>

      {!googleReady ? (
        <div className="onboarding-ai-gate__provider">
          <div className="onboarding-ai-gate__provider-head">
            <div><strong>۱. کلید Google را بساز</strong><span>صفحه رسمی در تب جدید باز می‌شود؛ بعد برگرد و کلید را اینجا Paste کن.</span></div>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">باز کردن AI Studio ↗</a>
          </div>
          <label htmlFor="onboarding-google-key">۲. API key را وارد کن</label>
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
          <div className="onboarding-ai-gate__actions">
            <button type="button" onClick={() => void save('google')} disabled={google.busy || loading || !google.apiKey.trim()}>{google.busy ? 'در حال بررسی...' : 'اعتبارسنجی و ذخیره'}</button>
          </div>
          {google.message ? <p className={google.error ? 'is-error' : 'is-success'} role="status">{google.message}</p> : null}
        </div>
      ) : (
        <div className="onboarding-ai-gate__actions">
          <button type="button" className="is-secondary" onClick={() => void retest('google')} disabled={google.busy}>{google.busy ? 'در حال تست...' : 'تست دوباره Google'}</button>
        </div>
      )}

      <details className="onboarding-ai-gate__fallback">
        <summary>AvalAI پشتیبان — اختیاری</summary>
        <p>درخواست عادی اول به Google می‌رود؛ AvalAI فقط در خطاهای مجاز fallback استفاده می‌شود.</p>
        {avalaiCredential?.status === 'active' ? (
          <div className="onboarding-ai-gate__status is-ready"><strong>AvalAI متصل است</strong><span>{avalaiCredential.keyHint}</span></div>
        ) : (
          <div className="onboarding-ai-gate__provider">
            <div className="onboarding-ai-gate__provider-head">
              <div><strong>کلید AvalAI داری؟</strong><span>اگر نداری، می‌توانی بعداً از تنظیمات AI اضافه‌اش کنی.</span></div>
              <a href="https://docs.avalai.ir/en/quickstart" target="_blank" rel="noreferrer">راهنمای رسمی ↗</a>
            </div>
            <label htmlFor="onboarding-avalai-key">AvalAI API key</label>
            <SecretField
              id="onboarding-avalai-key"
              value={avalai.apiKey}
              placeholder="کلید اختیاری AvalAI"
              disabled={avalai.busy}
              revealed={showAvalaiKey}
              onRevealChange={setShowAvalaiKey}
              onChange={(apiKey) => setAvalai((current) => ({ ...current, apiKey, message: '', error: false }))}
            />
            <small id="onboarding-avalai-key-privacy" className="onboarding-ai-gate__field-help">Fallback اختیاری است و مانع ادامه Onboarding نمی‌شود.</small>
            <div className="onboarding-ai-gate__actions"><button type="button" className="is-secondary" onClick={() => void save('avalai')} disabled={avalai.busy || !avalai.apiKey.trim()}>{avalai.busy ? 'در حال بررسی...' : 'ذخیره AvalAI'}</button></div>
          </div>
        )}
        {avalai.message ? <p className={avalai.error ? 'is-error' : 'is-success'} role="status">{avalai.message}</p> : null}
      </details>

      <p className="onboarding-ai-gate__privacy">Raw key فقط در state موقت همین فرم است؛ داخل JSON آنبوردینگ، حافظه ماندگار مرورگر، log یا analytics ذخیره نمی‌شود.</p>
    </div>
  );
}
