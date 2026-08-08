'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useAccountState } from '@/components/account-state';

type Message = { id: string; role: 'user' | 'assistant'; content: string; meta?: { provider?: string; modelId?: string; latencyMs?: number; fallbackFrom?: string | null; contextDomains?: string[] } };

const starter: Message = { id: 'welcome', role: 'assistant', content: 'سلام. من Coach نئوفیت هستم. می‌توانم بر اساس اطلاعات واقعی حساب، تمرین‌ها، تغذیه ثبت‌شده و محدودیت‌های Onboarding بهت پاسخ بدهم. در این نسخه چیزی را بدون تأییدت تغییر نمی‌دهم.' };
const prompts = ['وضعیت تمرین‌های اخیرم را جمع‌بندی کن', 'امروز از نظر تغذیه چه چیزی ثبت کرده‌ام؟', 'با توجه به آسیب‌هایم برای تمرین امروز چه نکته‌ای مهم است؟'];

export function CoachScreen() {
  const { account } = useAccountState();
  const [messages, setMessages] = useState<Message[]>([starter]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const history = useMemo(() => messages.filter((item) => item.id !== 'welcome').slice(-6).map(({ role, content }) => ({ role, content })), [messages]);

  async function sendMessage(content: string) {
    const message = content.trim();
    if (!message || loading || !account) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: message };
    setMessages((current) => [...current, userMessage].slice(-20));
    setInput(''); setError(''); setLoading(true);
    try {
      const response = await fetch('/api/ai/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, history }) });
      const payload = await response.json() as { answer?: string; error?: string; code?: string; meta?: Message['meta'] };
      if (!response.ok || !payload.answer) {
        if (response.status === 503 && payload.error === 'ai_not_configured') throw new Error('برای استفاده از Coach ابتدا در تنظیمات هوش مصنوعی یک کلید Google یا AvalAI معتبر ذخیره کن.');
        if (response.status === 401 && payload.error === 'authentication_required') throw new Error('Session حساب معتبر نیست؛ دوباره وارد حساب شو.');
        if (payload.error === 'ai_provider_unavailable') throw new Error(`Provider پاسخ نداد${payload.code ? ` (${payload.code})` : ''}. وضعیت کلید را در تنظیمات هوش مصنوعی بررسی کن.`);
        throw new Error('پاسخ Coach در دسترس نبود. دوباره تلاش کن.');
      }
      const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: payload.answer, meta: payload.meta };
      setMessages((current) => [...current, assistantMessage].slice(-20));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'خطای نامشخص'); }
    finally { setLoading(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void sendMessage(input); }

  return <section className="coach-page" aria-labelledby="coach-heading">
    <header className="coach-hero"><div><p className="section-kicker">NeoFit Coach</p><h2 id="coach-heading">Coach شخصی، روی داده واقعی تو</h2><p>Google اولویت اول است؛ AvalAI فقط در fallback کنترل‌شده استفاده می‌شود. Chat این صفحه فعلاً بین دستگاه‌ها ذخیره نمی‌شود.</p></div><span className="status-pill">read-only</span></header>
    {!account ? <article className="coach-auth-card"><h3>برای Coach وارد حساب شو</h3><p>Context پزشکی، تمرین و تغذیه فقط با Session معتبر و RLS خوانده می‌شود.</p><Link href="/auth">ورود یا ساخت حساب</Link></article> : <>
      <div className="coach-prompts">{prompts.map((prompt) => <button type="button" key={prompt} disabled={loading} onClick={() => void sendMessage(prompt)}>{prompt}</button>)}</div>
      <div className="coach-thread" aria-live="polite">{messages.map((message) => <article key={message.id} className={message.role === 'user' ? 'coach-message coach-message--user' : 'coach-message coach-message--assistant'}><div>{message.content}</div>{message.meta ? <footer><span>{message.meta.provider}/{message.meta.modelId}</span><span>{message.meta.latencyMs?.toLocaleString('fa-IR')} ms</span>{message.meta.fallbackFrom ? <span>fallback از {message.meta.fallbackFrom}</span> : null}{message.meta.contextDomains?.length ? <span>context: {message.meta.contextDomains.join(' · ')}</span> : null}</footer> : null}</article>)}{loading ? <article className="coach-message coach-message--assistant"><div>در حال خواندن context لازم و گرفتن یک پاسخ...</div></article> : null}</div>
      {error ? <p className="coach-error" role="alert">{error}</p> : null}
      <form className="coach-composer" onSubmit={submit}><textarea value={input} maxLength={2400} onChange={(event) => setInput(event.target.value)} placeholder="مثلاً: با توجه به تمرین اخیر و درد زانو، جلسه بعد را چطور مدیریت کنم؟" disabled={loading} /><button type="submit" disabled={loading || !input.trim()}>ارسال</button></form>
      <p className="coach-boundary">Coach v1 فقط می‌خواند و پیشنهاد می‌دهد؛ هیچ برنامه، غذای ثبت‌شده، هدف یا داده پزشکی را تغییر نمی‌دهد.</p>
    </>}
  </section>;
}
