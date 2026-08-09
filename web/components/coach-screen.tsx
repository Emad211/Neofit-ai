'use client';

import Link from 'next/link';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAccountState } from '@/components/account-state';
import type { YouTubeVideoCard } from '@/lib/integrations/types';

type MessageMeta = {
  provider?: string | null;
  modelId?: string | null;
  latencyMs?: number | null;
  fallbackFrom?: string | null;
  contextDomains?: string[];
};

type YouTubeToolData = {
  mode: 'search' | 'video';
  videos?: readonly YouTubeVideoCard[];
  url?: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: MessageMeta;
  youtube?: YouTubeToolData;
};

const starter: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'سلام. من Coach نئوفیت هستم. می‌توانم بر اساس اطلاعات واقعی حساب، تمرین‌ها، تغذیه ثبت‌شده و محدودیت‌های Onboarding بهت پاسخ بدهم. اگر ویدیوی آموزشی بخواهی، می‌توانم YouTube را هم به‌صورت کنترل‌شده جست‌وجو کنم یا یک لینک عمومی را با Gemini بررسی کنم.',
};

const prompts = [
  'وضعیت تمرین‌های اخیرم را جمع‌بندی کن',
  'امروز از نظر تغذیه چه چیزی ثبت کرده‌ام؟',
  'در یوتیوب یک ویدیوی آموزش اسکوات پیدا کن',
];

function faSeconds(value: number) {
  return new Intl.NumberFormat('fa-IR').format(Math.max(0, value));
}

function YouTubeCards({ videos }: { videos: readonly YouTubeVideoCard[] }) {
  if (videos.length === 0) return <p className="coach-youtube-empty">نتیجه ویدیویی مناسبی پیدا نشد.</p>;
  return (
    <div className="coach-youtube-grid" aria-label="نتایج YouTube">
      {videos.map((video) => (
        <a
          className="coach-youtube-card"
          href={video.watchUrl}
          target="_blank"
          rel="noreferrer noopener"
          key={video.videoId}
        >
          <div className="coach-youtube-card__media">
            {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" loading="lazy" /> : <span aria-hidden="true">▶</span>}
            {video.durationLabel ? <b>{video.durationLabel}</b> : null}
          </div>
          <div className="coach-youtube-card__body">
            <strong>{video.title}</strong>
            <span>{video.channelTitle || 'YouTube'}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export function CoachScreen() {
  const { account } = useAccountState();
  const [messages, setMessages] = useState<Message[]>([starter]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState<{ href: string; label: string } | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const endRef = useRef<HTMLDivElement | null>(null);

  const history = useMemo(
    () => messages
      .filter((item) => item.id !== 'welcome')
      .slice(-6)
      .map(({ role, content }) => ({ role, content })),
    [messages],
  );

  const cooldownSeconds = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  const blocked = loading || cooldownSeconds > 0;

  useEffect(() => {
    if (!cooldownUntil) return;
    const timer = window.setInterval(() => {
      const next = Date.now();
      setNow(next);
      if (next >= cooldownUntil) setCooldownUntil(null);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  async function sendMessage(content: string) {
    const message = content.trim();
    if (!message || blocked || !account) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: message };
    setMessages((current) => [...current, userMessage].slice(-20));
    setInput('');
    setError('');
    setErrorAction(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      const payload = await response.json() as {
        answer?: string;
        error?: string;
        code?: string;
        retryAfterSeconds?: number;
        meta?: MessageMeta;
        toolData?: { youtube?: YouTubeToolData };
      };

      if (!response.ok || !payload.answer) {
        if (response.status === 429) {
          const headerSeconds = Number.parseInt(response.headers.get('Retry-After') ?? '', 10);
          const retrySeconds = Number.isFinite(payload.retryAfterSeconds)
            ? Number(payload.retryAfterSeconds)
            : Number.isFinite(headerSeconds)
              ? headerSeconds
              : 60;
          setCooldownUntil(Date.now() + Math.max(1, retrySeconds) * 1000);
          if (payload.error === 'ai_request_budget_exceeded') {
            throw new Error(`برای محافظت از سهمیه و هزینه، درخواست‌های Coach موقتاً محدود شده‌اند. حدود ${faSeconds(retrySeconds)} ثانیه دیگر دوباره امتحان کن.`);
          }
          throw new Error(`YouTube یا Provider موقتاً rate-limit شده است. حدود ${faSeconds(retrySeconds)} ثانیه دیگر دوباره امتحان کن.`);
        }
        if (payload.error === 'youtube_not_configured') {
          setErrorAction({ href: '/profile/integrations', label: 'اتصال YouTube' });
          throw new Error('برای جست‌وجوی YouTube ابتدا کلید محدودشده YouTube Data API v3 را در اتصال‌ها ذخیره کن.');
        }
        if (payload.error === 'youtube_video_requires_google') {
          setErrorAction({ href: '/profile/ai', label: 'تنظیم Google Gemini' });
          throw new Error('فهم محتوای لینک YouTube در NeoFit فعلاً به کلید Google Gemini نیاز دارد؛ AvalAI برای این قابلیت fallback نمی‌شود.');
        }
        if (response.status === 503 && payload.error === 'ai_not_configured') {
          setErrorAction({ href: '/profile/ai', label: 'تنظیم هوش مصنوعی' });
          throw new Error('برای پاسخ هوشمند Coach یک کلید Google یا AvalAI معتبر ذخیره کن.');
        }
        if (response.status === 401 && payload.error === 'authentication_required') {
          setErrorAction({ href: '/auth', label: 'ورود دوباره' });
          throw new Error('Session حساب معتبر نیست؛ دوباره وارد حساب شو.');
        }
        if (payload.error === 'ai_provider_unavailable') {
          setErrorAction({ href: '/profile/ai', label: 'بررسی Providerها' });
          throw new Error(`Provider پاسخ نداد${payload.code ? ` (${payload.code})` : ''}. وضعیت کلید را بررسی کن.`);
        }
        if (payload.error === 'youtube_tool_unavailable') {
          setErrorAction({ href: '/profile/integrations', label: 'بررسی اتصال YouTube' });
          throw new Error('جست‌وجوی YouTube در دسترس نبود. وضعیت کلید یا سهمیه YouTube را بررسی کن.');
        }
        throw new Error('پاسخ Coach در دسترس نبود. دوباره تلاش کن.');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: payload.answer,
        meta: payload.meta,
        youtube: payload.toolData?.youtube,
      };
      setMessages((current) => [...current, assistantMessage].slice(-20));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function composerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <section className="coach-page" aria-labelledby="coach-heading" aria-busy={loading}>
      <header className="coach-hero">
        <div>
          <p className="section-kicker">NeoFit Coach</p>
          <h2 id="coach-heading">Coach شخصی، روی داده واقعی تو</h2>
          <p>Google اولویت اول است و AvalAI fallback کنترل‌شده. YouTube فقط با درخواست صریح تو فعال می‌شود. Chat این صفحه فعلاً بین دستگاه‌ها ذخیره نمی‌شود.</p>
        </div>
        <span className="status-pill">read-only</span>
      </header>

      {!account ? (
        <article className="coach-auth-card">
          <h3>برای Coach وارد حساب شو</h3>
          <p>Context پزشکی، تمرین و تغذیه فقط با Session معتبر و RLS خوانده می‌شود.</p>
          <Link href="/auth">ورود یا ساخت حساب</Link>
        </article>
      ) : (
        <>
          <div className="coach-prompts">
            {prompts.map((prompt) => (
              <button type="button" key={prompt} disabled={blocked} onClick={() => void sendMessage(prompt)}>{prompt}</button>
            ))}
          </div>

          <div className="coach-thread" aria-live="polite" aria-relevant="additions">
            {messages.map((message) => (
              <article key={message.id} className={message.role === 'user' ? 'coach-message coach-message--user' : 'coach-message coach-message--assistant'}>
                <div className="coach-message__text">{message.content}</div>
                {message.youtube?.mode === 'search' && message.youtube.videos ? <YouTubeCards videos={message.youtube.videos} /> : null}
                {message.youtube?.mode === 'video' && message.youtube.url ? (
                  <a className="coach-video-source" href={message.youtube.url} target="_blank" rel="noreferrer noopener">باز کردن ویدیوی بررسی‌شده در YouTube</a>
                ) : null}
                {message.meta && (message.meta.provider || message.meta.contextDomains?.length) ? (
                  <details className="coach-technical-details">
                    <summary>جزئیات فنی پاسخ</summary>
                    <div>
                      {message.meta.provider ? <span>Provider: {message.meta.provider}</span> : null}
                      {message.meta.modelId ? <span>Model: {message.meta.modelId}</span> : null}
                      {typeof message.meta.latencyMs === 'number' ? <span>Latency: {message.meta.latencyMs.toLocaleString('fa-IR')} ms</span> : null}
                      {message.meta.fallbackFrom ? <span>Fallback از {message.meta.fallbackFrom}</span> : null}
                      {message.meta.contextDomains?.length ? <span>Context: {message.meta.contextDomains.join(' · ')}</span> : null}
                    </div>
                  </details>
                ) : null}
              </article>
            ))}
            {loading ? <article className="coach-message coach-message--assistant"><div className="coach-thinking"><span aria-hidden="true" />در حال خواندن فقط context و ابزار لازم...</div></article> : null}
            <div ref={endRef} />
          </div>

          {cooldownSeconds > 0 ? <p className="coach-cooldown" role="status">ارسال بعدی تا {faSeconds(cooldownSeconds)} ثانیه دیگر</p> : null}
          {error ? (
            <div className="coach-error" role="alert">
              <span>{error}</span>
              {errorAction ? <Link href={errorAction.href}>{errorAction.label}</Link> : null}
            </div>
          ) : null}

          <form className="coach-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="coach-message-input">پیام به NeoFit Coach</label>
            <textarea
              id="coach-message-input"
              value={input}
              maxLength={2400}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={composerKeyDown}
              placeholder="مثلاً: در یوتیوب یک آموزش اسکوات پیدا کن، یا این لینک را بررسی کن..."
              disabled={blocked}
            />
            <button type="submit" disabled={blocked || !input.trim()}>{loading ? 'در حال پاسخ...' : 'ارسال'}</button>
          </form>
          <p className="coach-composer-hint">Enter خط جدید · Ctrl/⌘ + Enter ارسال</p>
          <p className="coach-boundary">Coach فعلاً فقط می‌خواند و پیشنهاد می‌دهد؛ هیچ برنامه، هدف یا داده پزشکی را بدون ابزار write و تأیید صریح تغییر نمی‌دهد.</p>
        </>
      )}
    </section>
  );
}
