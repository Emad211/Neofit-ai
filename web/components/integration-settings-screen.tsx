'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NeoFitIcon } from '@/components/neofit-icons';
import type { IntegrationCredentialMetadata } from '@/lib/integrations/types';

function formatDate(value: string | null | undefined) {
  if (!value) return 'هنوز تست نشده';
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function IntegrationSettingsScreen() {
  const [credential, setCredential] = useState<IntegrationCredentialMetadata | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [authenticationRequired, setAuthenticationRequired] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const response = await fetch('/api/integrations/youtube', { cache: 'no-store' });
        if (response.status === 401) {
          if (alive) setAuthenticationRequired(true);
          return;
        }
        if (!response.ok) throw new Error('load_failed');
        const body = await response.json() as { credential?: IntegrationCredentialMetadata | null };
        if (alive) setCredential(body.credential ?? null);
      } catch {
        if (alive) { setMessage('خواندن وضعیت اتصال YouTube ممکن نشد.'); setError(true); }
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, []);

  async function save() {
    const key = apiKey.trim();
    if (!key) { setMessage('ابتدا کلید YouTube Data API را وارد کن.'); setError(true); return; }
    setBusy(true); setError(false); setMessage('در حال اعتبارسنجی کم‌هزینه و ذخیره امن...');
    try {
      const response = await fetch('/api/integrations/youtube', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });
      const body = await response.json() as IntegrationCredentialMetadata & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'save_failed');
      setCredential(body);
      setApiKey('');
      setMessage('کلید معتبر است و به‌صورت رمز‌شده ذخیره شد.');
    } catch {
      setMessage('اعتبارسنجی یا ذخیره کلید انجام نشد. فعال‌بودن YouTube Data API v3 و محدودیت‌های کلید را بررسی کن.');
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (!credential || busy) return;
    setBusy(true); setError(false); setMessage('در حال تست اتصال بدون search...');
    try {
      const response = await fetch('/api/integrations/youtube', { method: 'POST' });
      const body = await response.json() as IntegrationCredentialMetadata & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'test_failed');
      setCredential(body);
      setMessage('اتصال YouTube Data API سالم است؛ برای تست، search quota مصرف نشد.');
    } catch {
      setMessage('تست اتصال ناموفق بود. کلید یا محدودیت API را بررسی کن.');
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!credential || busy || !window.confirm('کلید YouTube از NeoFit حذف شود؟')) return;
    setBusy(true); setError(false); setMessage('در حال حذف...');
    try {
      const response = await fetch('/api/integrations/youtube', { method: 'DELETE' });
      if (!response.ok) throw new Error('delete_failed');
      setCredential(null);
      setMessage('کلید YouTube حذف شد.');
    } catch {
      setMessage('حذف کلید انجام نشد.');
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (authenticationRequired) {
    return (
      <section className="page-stack" aria-labelledby="integration-heading">
        <div className="section-heading"><div><p className="section-kicker">Agent tools</p><h2 id="integration-heading">اتصال‌های خارجی</h2></div></div>
        <article className="ai-settings-auth-card">
          <NeoFitIcon name="profile" size={24} />
          <div><h3>برای اتصال YouTube وارد حساب شو</h3><p>کلید Integration به حساب و RLS وابسته است و در Guest ذخیره نمی‌شود.</p></div>
          <Link href="/auth">ورود یا ساخت حساب</Link>
        </article>
      </section>
    );
  }

  const active = credential?.status === 'active';
  return (
    <section className="page-stack" aria-labelledby="integration-heading">
      <div className="section-heading">
        <div><p className="section-kicker">Agent tools</p><h2 id="integration-heading">اتصال YouTube</h2></div>
        <Link className="ai-settings-back" href="/profile">بازگشت</Link>
      </div>

      <article className="integration-explainer-card">
        <div className="integration-explainer-card__icon"><NeoFitIcon name="sparkle" size={22} /></div>
        <div>
          <span>کلید مستقل</span>
          <h3>YouTube Data API v3 برای جست‌وجو و metadata</h3>
          <p>این کلید با Google AI Studio/Gemini فرق دارد. بهتر است در Google Cloud فقط به YouTube Data API v3 محدود شود. NeoFit آن را فقط سمت سرور decrypt می‌کند.</p>
        </div>
      </article>

      <article className="integration-card">
        <header>
          <div><span className="integration-logo" aria-hidden="true">▶</span><div><h3>YouTube</h3><p>جست‌وجوی آموزش‌های ویدیویی فقط وقتی خودت درخواست ویدئو می‌کنی.</p></div></div>
          <span className={`ai-provider-card__badge ${active ? 'is-active' : ''}`}>{active ? 'متصل' : credential ? 'نیازمند بررسی' : 'تنظیم نشده'}</span>
        </header>

        {loading ? <p className="ai-settings-loading" aria-busy="true">در حال خواندن وضعیت...</p> : null}
        {credential ? (
          <div className="ai-provider-meta">
            <span>کلید <strong>{credential.keyHint}</strong></span>
            <span>آخرین اعتبارسنجی <strong>{formatDate(credential.lastValidatedAt)}</strong></span>
            {credential.lastFailureCode ? <span>آخرین خطا <strong>{credential.lastFailureCode}</strong></span> : null}
          </div>
        ) : null}

        <label htmlFor="youtube-api-key">YouTube Data API key</label>
        <input
          id="youtube-api-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          placeholder={credential ? 'برای جایگزینی، کلید جدید را وارد کن' : 'کلید محدودشده YouTube Data API v3'}
          onChange={(event) => { setApiKey(event.target.value); setMessage(''); setError(false); }}
          disabled={busy}
        />

        <div className="ai-provider-actions">
          <button type="button" onClick={() => void save()} disabled={busy || !apiKey.trim()}>{busy ? 'در حال انجام...' : credential ? 'جایگزینی کلید' : 'اعتبارسنجی و ذخیره'}</button>
          <button type="button" className="is-secondary" onClick={() => void test()} disabled={busy || !credential}>تست بدون search</button>
          {credential ? <button type="button" className="is-danger" onClick={() => void remove()} disabled={busy}>حذف</button> : null}
        </div>
        {message ? <p className={`ai-provider-message ${error ? 'is-error' : ''}`} role="status">{message}</p> : null}
      </article>

      <div className="profile-boundary-note"><NeoFitIcon name="check" size={18} /><p>جست‌وجو با YouTube Data API انجام می‌شود؛ فهم محتوای یک ویدئوی عمومی در Coach با کلید Gemini خودت انجام می‌شود. کلیدها با هم قاطی نمی‌شوند.</p></div>
    </section>
  );
}
