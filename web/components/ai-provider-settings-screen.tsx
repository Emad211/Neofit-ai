'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { NeoFitIcon } from '@/components/neofit-icons';
import { DEFAULT_AI_MODELS } from '@/lib/ai/config';
import type { AiCredentialMetadata, AiProvider } from '@/lib/ai/types';

interface ProviderDraft {
  apiKey: string;
  busy: boolean;
  message: string;
  error: boolean;
}

const providerCopy: Record<AiProvider, {
  title: string;
  badge: string;
  description: string;
  placeholder: string;
}> = {
  avalai: {
    title: 'AvalAI',
    badge: 'برای برنامه شخصی',
    description: 'این اتصال برای ساخت برنامه شخصی NeoFit لازم است.',
    placeholder: 'کلید شخصی AvalAI',
  },
  google: {
    title: 'Google Gemini',
    badge: 'اختیاری',
    description: 'اگر کلید Google داری، می‌توانی آن را هم برای قابلیت‌های بیشتر اضافه کنی.',
    placeholder: 'کلید شخصی Google',
  },
};

const providers: readonly AiProvider[] = ['avalai', 'google'];

function emptyDraft(): ProviderDraft {
  return { apiKey: '', busy: false, message: '', error: false };
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'هنوز بررسی نشده';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AiProviderSettingsScreen() {
  const [credentials, setCredentials] = useState<AiCredentialMetadata[]>([]);
  const [drafts, setDrafts] = useState<Record<AiProvider, ProviderDraft>>({
    google: emptyDraft(),
    avalai: emptyDraft(),
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
        if (alive) setCredentials(body.providers ?? []);
      } catch {
        if (alive) {
          setDrafts((current) => ({
            ...current,
            avalai: { ...current.avalai, message: 'وضعیت اتصال‌ها بارگذاری نشد. دوباره تلاش کن.', error: true },
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
      patchDraft(provider, { message: 'ابتدا کلید را وارد کن.', error: true });
      return;
    }
    patchDraft(provider, { busy: true, message: 'در حال بررسی اتصال...', error: false });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: draft.apiKey, modelId: DEFAULT_AI_MODELS[provider] }),
      });
      const body = await response.json() as AiCredentialMetadata & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'credential_save_failed');
      updateCredential(body);
      patchDraft(provider, { apiKey: '', busy: false, message: 'اتصال با موفقیت ذخیره شد.', error: false });
    } catch {
      patchDraft(provider, { busy: false, message: 'اتصال برقرار نشد. کلید را بررسی کن و دوباره تلاش کن.', error: true });
    }
  }

  async function testCredential(provider: AiProvider) {
    patchDraft(provider, { busy: true, message: 'در حال بررسی اتصال...', error: false });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, { method: 'POST' });
      if (!response.ok) throw new Error('credential_test_failed');
      const body = await response.json() as AiCredentialMetadata & { ok?: boolean };
      updateCredential(body);
      patchDraft(provider, { busy: false, message: 'اتصال سالم است.', error: false });
    } catch {
      patchDraft(provider, { busy: false, message: 'اتصال برقرار نشد. دوباره تلاش کن.', error: true });
    }
  }

  async function remove(provider: AiProvider) {
    if (!window.confirm(`اتصال ${providerCopy[provider].title} حذف شود؟`)) return;
    patchDraft(provider, { busy: true, message: 'در حال حذف...', error: false });
    try {
      const response = await fetch(`/api/ai/providers/${provider}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('credential_delete_failed');
      setCredentials((current) => current.filter((item) => item.provider !== provider));
      patchDraft(provider, { ...emptyDraft(), message: 'اتصال حذف شد.' });
    } catch {
      patchDraft(provider, { busy: false, message: 'حذف اتصال انجام نشد.', error: true });
    }
  }

  if (authenticationRequired) {
    return (
      <section className="page-stack" aria-labelledby="ai-settings-heading">
        <div className="section-heading"><div><p className="section-kicker">مربی هوشمند</p><h2 id="ai-settings-heading">اتصال هوش مصنوعی</h2></div></div>
        <article className="ai-settings-auth-card">
          <NeoFitIcon name="profile" size={24} />
          <div><h3>برای مدیریت اتصال‌ها وارد حساب شو</h3><p>اتصال‌های مربی هوشمند فقط برای حساب خودت ذخیره می‌شوند.</p></div>
          <Link href="/auth">ورود یا ساخت حساب</Link>
        </article>
      </section>
    );
  }

  return (
    <section className="page-stack" aria-labelledby="ai-settings-heading">
      <div className="section-heading">
        <div><p className="section-kicker">مربی هوشمند</p><h2 id="ai-settings-heading">اتصال هوش مصنوعی</h2><p>کلید سرویس‌هایی را که خودت استفاده می‌کنی اینجا مدیریت کن.</p></div>
        <Link className="ai-settings-back" href="/profile">بازگشت</Link>
      </div>

      {loading ? <div className="ai-settings-loading" aria-busy="true">در حال خواندن تنظیمات...</div> : null}

      <div className="ai-provider-grid">
        {providers.map((provider, index) => {
          const meta = byProvider.get(provider);
          const draft = drafts[provider];
          const active = meta?.status === 'active';
          return (
            <article className="ai-provider-card" key={provider}>
              <header>
                <div>
                  <span className="ai-provider-card__order">{index + 1}</span>
                  <div><h3>{providerCopy[provider].title}</h3><p>{providerCopy[provider].description}</p></div>
                </div>
                <span className={`ai-provider-card__badge ${active ? 'is-active' : ''}`}>{providerCopy[provider].badge}</span>
              </header>

              <div className="ai-provider-status">
                <span><NeoFitIcon name={active ? 'check' : 'offline'} size={16} />{active ? 'متصل' : meta ? 'نیاز به بررسی' : 'متصل نیست'}</span>
                {meta ? <small>{meta.keyHint}</small> : null}
              </div>

              <label htmlFor={`${provider}-key`}>کلید اتصال</label>
              <input
                id={`${provider}-key`}
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={meta ? 'برای جایگزینی، کلید جدید را وارد کن' : providerCopy[provider].placeholder}
                value={draft.apiKey}
                onChange={(event) => patchDraft(provider, { apiKey: event.target.value, message: '', error: false })}
                disabled={draft.busy}
              />

              {meta ? <div className="ai-provider-meta"><span>آخرین بررسی <strong>{formatDate(meta.lastValidatedAt)}</strong></span></div> : null}

              <div className="ai-provider-actions">
                <button type="button" onClick={() => void save(provider)} disabled={draft.busy || !draft.apiKey.trim()}>{draft.busy ? 'در حال انجام...' : meta ? 'جایگزینی کلید' : 'اتصال'}</button>
                <button type="button" className="is-secondary" onClick={() => void testCredential(provider)} disabled={draft.busy || !meta}>بررسی اتصال</button>
                {meta ? <button type="button" className="is-danger" onClick={() => void remove(provider)} disabled={draft.busy}>حذف</button> : null}
              </div>

              {draft.message ? <p className={`ai-provider-message ${draft.error ? 'is-error' : ''}`} role="status">{draft.message}</p> : null}
            </article>
          );
        })}
      </div>

      <div className="profile-boundary-note"><NeoFitIcon name="check" size={18} /><p>کلید واردشده پس از ذخیره دوباره در صفحه نمایش داده نمی‌شود.</p></div>
    </section>
  );
}
