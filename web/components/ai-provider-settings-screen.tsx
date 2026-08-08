'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { NeoFitIcon } from '@/components/neofit-icons';
import { DEFAULT_AI_MODELS } from '@/lib/ai/config';
import type { AiCredentialMetadata, AiProvider } from '@/lib/ai/types';

interface ProviderDraft {
  apiKey: string;
  modelId: string;
  busy: boolean;
  message: string;
  error: boolean;
}

const providerCopy: Record<AiProvider, {
  title: string;
  badge: string;
  description: string;
}> = {
  google: {
    title: 'Google Gemini',
    badge: 'اولویت اول',
    description: 'درخواست‌های عادی ابتدا با کلید Google AI Studio خودت ارسال می‌شوند.',
  },
  avalai: {
    title: 'AvalAI',
    badge: 'Fallback',
    description: 'فقط وقتی Google طبق سیاست fallback در دسترس نباشد استفاده می‌شود.',
  },
};

const providers: readonly AiProvider[] = ['google', 'avalai'];

function emptyDraft(provider: AiProvider): ProviderDraft {
  return {
    apiKey: '',
    modelId: DEFAULT_AI_MODELS[provider],
    busy: false,
    message: '',
    error: false,
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'هنوز تست نشده';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AiProviderSettingsScreen() {
  const [credentials, setCredentials] = useState<AiCredentialMetadata[]>([]);
  const [drafts, setDrafts] = useState<Record<AiProvider, ProviderDraft>>({
    google: emptyDraft('google'),
    avalai: emptyDraft('avalai'),
  });
  const [loading, setLoading] = useState(true);
  const [authenticationRequired, setAuthenticationRequired] = useState(false);

  const byProvider = useMemo(
    () => new Map(credentials.map((credential) => [credential.provider, credential])),
    [credentials],
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const response = await fetch('/api/ai/providers', { cache: 'no-store' });
        if (response.status === 401) {
          if (alive) setAuthenticationRequired(true);
          return;
        }
        if (!response.ok) throw new Error('provider_load_failed');
        const body = await response.json() as { providers?: AiCredentialMetadata[] };
        if (!alive) return;
        const next = body.providers ?? [];
        setCredentials(next);
        setDrafts((current) => ({
          google: {
            ...current.google,
            modelId: next.find((item) => item.provider === 'google')?.modelId ?? current.google.modelId,
          },
          avalai: {
            ...current.avalai,
            modelId: next.find((item) => item.provider === 'avalai')?.modelId ?? current.avalai.modelId,
          },
        }));
      } catch {
        if (alive) {
          setDrafts((current) => ({
            google: { ...current.google, message: 'خواندن وضعیت Providerها ممکن نشد.', error: true },
            avalai: current.avalai,
          }));
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, []);

  function patchDraft(provider: AiProvider, patch: Partial<ProviderDraft>) {
    setDrafts((current) => ({
      ...current,
      [provider]: { ...current[provider], ...patch },
    }));
  }

  function updateCredential(metadata: AiCredentialMetadata) {
    setCredentials((current) => [
      ...current.filter((item) => item.provider !== metadata.provider),
      metadata,
    ]);
  }

  async function save(provider: AiProvider) {
    const draft = drafts[provider];
    if (!draft.apiKey.trim()) {
      patchDraft(provider, { message: 'ابتدا API key را وارد کن.', error: true });
      return;
    }
    patchDraft(provider, { busy: true, message: 'در حال اعتبارسنجی و ذخیره امن...', error: false });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: draft.apiKey, modelId: draft.modelId }),
      });
      const body = await response.json() as AiCredentialMetadata & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'credential_save_failed');
      updateCredential(body);
      patchDraft(provider, {
        apiKey: '',
        busy: false,
        message: 'کلید معتبر است و به‌صورت رمز‌شده ذخیره شد.',
        error: false,
      });
    } catch {
      patchDraft(provider, {
        busy: false,
        message: 'اعتبارسنجی یا ذخیره کلید انجام نشد. مقدار و مدل را بررسی کن.',
        error: true,
      });
    }
  }

  async function testCredential(provider: AiProvider) {
    patchDraft(provider, { busy: true, message: 'در حال تست اتصال بدون inference...', error: false });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, { method: 'POST' });
      if (!response.ok) throw new Error('credential_test_failed');
      const body = await response.json() as AiCredentialMetadata & { ok?: boolean };
      updateCredential(body);
      patchDraft(provider, { busy: false, message: 'اتصال Provider سالم است.', error: false });
    } catch {
      patchDraft(provider, { busy: false, message: 'تست اتصال ناموفق بود.', error: true });
    }
  }

  async function remove(provider: AiProvider) {
    if (!window.confirm(`کلید ${providerCopy[provider].title} حذف شود؟`)) return;
    patchDraft(provider, { busy: true, message: 'در حال حذف...', error: false });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('credential_delete_failed');
      setCredentials((current) => current.filter((item) => item.provider !== provider));
      patchDraft(provider, { ...emptyDraft(provider), message: 'کلید حذف شد.' });
    } catch {
      patchDraft(provider, { busy: false, message: 'حذف کلید انجام نشد.', error: true });
    }
  }

  if (authenticationRequired) {
    return (
      <section className="page-stack" aria-labelledby="ai-settings-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">BYOK</p>
            <h2 id="ai-settings-heading">تنظیمات هوش مصنوعی</h2>
          </div>
        </div>
        <article className="ai-settings-auth-card">
          <NeoFitIcon name="profile" size={24} />
          <div>
            <h3>برای ذخیره امن کلید وارد حساب شو</h3>
            <p>کلیدهای Provider به حساب کاربر و RLS وابسته‌اند و در حالت مهمان ذخیره نمی‌شوند.</p>
          </div>
          <Link href="/auth">ورود یا ساخت حساب</Link>
        </article>
      </section>
    );
  }

  return (
    <section className="page-stack" aria-labelledby="ai-settings-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">هوش مصنوعی شخصی</p>
          <h2 id="ai-settings-heading">Google اول، AvalAI پشتیبان</h2>
        </div>
        <Link className="ai-settings-back" href="/profile">بازگشت</Link>
      </div>

      <article className="ai-routing-card">
        <div className="ai-routing-card__icon"><NeoFitIcon name="sparkle" size={22} /></div>
        <div>
          <span>مسیر بهینه درخواست</span>
          <h3>یک Query حساب + یک Request به Google</h3>
          <p>در حالت سالم AvalAI اصلاً فراخوانی نمی‌شود. تست کلید نیز inference و توکن تولید نمی‌کند.</p>
        </div>
      </article>

      {loading ? <div className="ai-settings-loading" aria-busy="true">در حال خواندن تنظیمات...</div> : null}

      <div className="ai-provider-grid">
        {providers.map((provider, index) => {
          const meta = byProvider.get(provider);
          const draft = drafts[provider];
          const active = meta?.status === 'active';
          const cooldown = meta?.cooldownUntil && Date.parse(meta.cooldownUntil) > Date.now();
          return (
            <article className="ai-provider-card" key={provider}>
              <header>
                <div>
                  <span className="ai-provider-card__order">{index + 1}</span>
                  <div>
                    <h3>{providerCopy[provider].title}</h3>
                    <p>{providerCopy[provider].description}</p>
                  </div>
                </div>
                <span className={`ai-provider-card__badge ${active ? 'is-active' : ''}`}>
                  {providerCopy[provider].badge}
                </span>
              </header>

              <div className="ai-provider-status">
                <span><NeoFitIcon name={active ? 'check' : 'offline'} size={16} />{active ? 'متصل' : meta ? 'نیازمند بررسی' : 'تنظیم نشده'}</span>
                {meta ? <small>{meta.keyHint}</small> : null}
              </div>

              <label htmlFor={`${provider}-key`}>API key</label>
              <input
                id={`${provider}-key`}
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={meta ? 'برای جایگزینی، کلید جدید را وارد کن' : 'کلید شخصی Provider'}
                value={draft.apiKey}
                onChange={(event) => patchDraft(provider, { apiKey: event.target.value, message: '', error: false })}
                disabled={draft.busy}
              />

              <label htmlFor={`${provider}-model`}>مدل</label>
              <input
                id={`${provider}-model`}
                value={draft.modelId}
                maxLength={120}
                onChange={(event) => patchDraft(provider, { modelId: event.target.value, message: '', error: false })}
                disabled={draft.busy}
              />

              {meta ? (
                <div className="ai-provider-meta">
                  <span>آخرین اعتبارسنجی <strong>{formatDate(meta.lastValidatedAt)}</strong></span>
                  {cooldown ? <span>Cooldown <strong>{formatDate(meta.cooldownUntil)}</strong></span> : null}
                  {meta.lastFailureCode ? <span>آخرین خطا <strong>{meta.lastFailureCode}</strong></span> : null}
                </div>
              ) : null}

              <div className="ai-provider-actions">
                <button type="button" onClick={() => void save(provider)} disabled={draft.busy || !draft.apiKey.trim()}>
                  {draft.busy ? 'در حال انجام...' : meta ? 'جایگزینی کلید' : 'اعتبارسنجی و ذخیره'}
                </button>
                <button type="button" className="is-secondary" onClick={() => void testCredential(provider)} disabled={draft.busy || !meta}>
                  تست اتصال
                </button>
                {meta ? <button type="button" className="is-danger" onClick={() => void remove(provider)} disabled={draft.busy}>حذف</button> : null}
              </div>

              {draft.message ? <p className={`ai-provider-message ${draft.error ? 'is-error' : ''}`} role="status">{draft.message}</p> : null}
            </article>
          );
        })}
      </div>

      <div className="profile-boundary-note">
        <NeoFitIcon name="check" size={18} />
        <p>Raw API key بعد از Save از ورودی پاک می‌شود، هرگز از API برنمی‌گردد و در Browser storage ذخیره نمی‌شود.</p>
      </div>
    </section>
  );
}
