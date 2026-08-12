'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NeoFitIcon } from '@/components/neofit-icons';
import type { IntegrationCredentialMetadata } from '@/lib/integrations/types';

function formatDate(value: string | null | undefined) {
  if (!value) return 'هنوز بررسی نشده';
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
        if (alive) { setMessage('وضعیت اتصال YouTube بارگذاری نشد. دوباره تلاش کن.'); setError(true); }
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, []);

  async function save() {
    const key = apiKey.trim();
    if (!key) { setMessage('ابتدا کلید YouTube را وارد کن.'); setError(true); return; }
    setBusy(true); setError(false); setMessage('در حال بررسی اتصال...');
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
      setMessage('اتصال YouTube با موفقیت ذخیره شد.');
    } catch {
      setMessage('اتصال برقرار نشد. کلید و فعال‌بودن YouTube Data API را بررسی کن.');
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (!credential || busy) return;
    setBusy(true); setError(false); setMessage('در حال بررسی اتصال...');
    try {
      const response = await fetch('/api/integrations/youtube', { method: 'POST' });
      const body = await response.json() as IntegrationCredentialMetadata & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'test_failed');
      setCredential(body);
      setMessage('اتصال YouTube سالم است.');
    } catch {
      setMessage('اتصال YouTube برقرار نشد. کلید یا محدودیت‌های آن را بررسی کن.');
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!credential || busy || !window.confirm('اتصال YouTube از NeoFit حذف شود؟')) return;
    setBusy(true); setError(false); setMessage('در حال حذف...');
    try {
      const response = await fetch('/api/integrations/youtube', { method: 'DELETE' });
      if (!response.ok) throw new Error('delete_failed');
      setCredential(null);
      setMessage('اتصال YouTube حذف شد.');
    } catch {
      setMessage('حذف اتصال انجام نشد.');
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (authenticationRequired) {
    return (
      <section className="page-stack" aria-labelledby="integration-heading">
        <div className="section-heading"><div><p className="section-kicker">اتصال‌ها</p><h2 id="integration-heading">YouTube</h2></div></div>
        <article className="ai-settings-auth-card">
          <NeoFitIcon name="profile" size={24} />
          <div><h3>برای مدیریت اتصال YouTube وارد حساب شو</h3><p>اتصال‌های شخصی فقط برای حساب خودت ذخیره می‌شوند.</p></div>
          <Link href="/auth">ورود یا ساخت حساب</Link>
        </article>
      </section>
    );
  }

  const active = credential?.status === 'active';
  return (
    <section className="page-stack" aria-labelledby="integration-heading">
      <div className="section-heading">
        <div><p className="section-kicker">اتصال‌ها</p><h2 id="integration-heading">YouTube</h2><p>برای پیدا کردن آموزش‌های ویدیویی از داخل مربی NeoFit، کلید YouTube خودت را اضافه کن.</p></div>
        <Link className="ai-settings-back" href="/profile">بازگشت</Link>
      </div>

      <article className="integration-card">
        <header>
          <div><span className="integration-logo" aria-hidden="true">▶</span><div><h3>YouTube</h3><p>جست‌وجوی ویدیو فقط وقتی خودت درخواستش کنی انجام می‌شود.</p></div></div>
          <span className={`ai-provider-card__badge ${active ? 'is-active' : ''}`}>{active ? 'متصل' : credential ? 'نیاز به بررسی' : 'متصل نیست'}</span>
        </header>

        {loading ? <p className="ai-settings-loading" aria-busy="true">در حال خواندن وضعیت...</p> : null}
        {credential ? (
          <div className="ai-provider-meta">
            <span>کلید <strong>{credential.keyHint}</strong></span>
            <span>آخرین بررسی <strong>{formatDate(credential.lastValidatedAt)}</strong></span>
          </div>
        ) : null}

        <label htmlFor="youtube-api-key">کلید YouTube</label>
        <input
          id="youtube-api-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          placeholder={credential ? 'برای جایگزینی، کلید جدید را وارد کن' : 'YouTube Data API key'}
          onChange={(event) => { setApiKey(event.target.value); setMessage(''); setError(false); }}
          disabled={busy}
        />

        <div className="ai-provider-actions">
          <button type="button" onClick={() => void save()} disabled={busy || !apiKey.trim()}>{busy ? 'در حال انجام...' : credential ? 'جایگزینی کلید' : 'اتصال'}</button>
          <button type="button" className="is-secondary" onClick={() => void test()} disabled={busy || !credential}>بررسی اتصال</button>
          {credential ? <button type="button" className="is-danger" onClick={() => void remove()} disabled={busy}>حذف</button> : null}
        </div>
        {message ? <p className={`ai-provider-message ${error ? 'is-error' : ''}`} role="status">{message}</p> : null}
      </article>

      <div className="profile-boundary-note"><NeoFitIcon name="check" size={18} /><p>کلید واردشده پس از ذخیره دوباره در صفحه نمایش داده نمی‌شود.</p></div>
    </section>
  );
}
