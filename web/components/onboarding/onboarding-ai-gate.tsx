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

export function OnboardingAiGate({
  mode,
  onGoogleReadyChange,
}: {
  readonly mode: OnboardingMode;
  readonly onGoogleReadyChange(ready: boolean): void;
}) {
  const [credentials, setCredentials] = useState<AiCredentialMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [google, setGoogle] = useState<ProviderState>(emptyProviderState);
  const [avalai, setAvalai] = useState<ProviderState>(emptyProviderState);

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
          ? 'Google معتبر است؛ می‌توانی Onboarding را ادامه بدهی.'
          : 'AvalAI به‌عنوان fallback ذخیره شد.',
      });
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
        <p>می‌توانی فرم را برای دیدن تجربه کاربری ادامه بدهی، اما NeoFit این مسیر را برنامه شخصی AI-generated حساب نمی‌کند. برای چرخه واقعی باید وارد حساب شوی.</p>
        <a className="onboarding-ai-gate__auth-link" href="/auth">ورود یا ساخت حساب</a>
      </div>
    );
  }

  return (
    <div className="onboarding-ai-gate">
      <div className={`onboarding-ai-gate__status ${googleReady ? 'is-ready' : ''}`}>
        <strong>{googleReady ? 'Google Gemini متصل است' : 'ابتدا Google AI Studio را متصل کن'}</strong>
        <span>{googleReady ? `${googleCredential?.keyHint ?? ''} · ${googleCredential?.modelId ?? DEFAULT_AI_MODELS.google}` : 'این Provider برای ساخت برنامه و Coach اصلی لازم است.'}</span>
      </div>

      {!googleReady ? (
        <div className="onboarding-ai-gate__provider">
          <label htmlFor="onboarding-google-key">Google AI Studio API key</label>
          <input
            id="onboarding-google-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={google.apiKey}
            onChange={(event) => setGoogle((current) => ({ ...current, apiKey: event.target.value, message: '', error: false }))}
            placeholder="کلید شخصی Google"
            disabled={google.busy || loading}
          />
          <div className="onboarding-ai-gate__actions">
            <button type="button" onClick={() => void save('google')} disabled={google.busy || loading || !google.apiKey.trim()}>{google.busy ? 'در حال بررسی...' : 'اعتبارسنجی و ذخیره امن'}</button>
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
        <p>درخواست عادی همیشه اول به Google می‌رود؛ AvalAI فقط در خطاهای مجاز fallback استفاده می‌شود.</p>
        {avalaiCredential?.status === 'active' ? (
          <div className="onboarding-ai-gate__status is-ready"><strong>AvalAI متصل است</strong><span>{avalaiCredential.keyHint}</span></div>
        ) : (
          <div className="onboarding-ai-gate__provider">
            <label htmlFor="onboarding-avalai-key">AvalAI API key</label>
            <input
              id="onboarding-avalai-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={avalai.apiKey}
              onChange={(event) => setAvalai((current) => ({ ...current, apiKey: event.target.value, message: '', error: false }))}
              placeholder="کلید اختیاری AvalAI"
              disabled={avalai.busy}
            />
            <div className="onboarding-ai-gate__actions"><button type="button" className="is-secondary" onClick={() => void save('avalai')} disabled={avalai.busy || !avalai.apiKey.trim()}>{avalai.busy ? 'در حال بررسی...' : 'ذخیره AvalAI'}</button></div>
          </div>
        )}
        {avalai.message ? <p className={avalai.error ? 'is-error' : 'is-success'} role="status">{avalai.message}</p> : null}
      </details>

      <p className="onboarding-ai-gate__privacy">Raw key فقط در state موقت همین فرم است؛ داخل Onboarding JSON، localStorage، log یا analytics ذخیره نمی‌شود.</p>
    </div>
  );
}
