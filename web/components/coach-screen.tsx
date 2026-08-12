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
  content: 'سلام. من مربی NeoFit هستم. می‌توانم درباره تمرین، تغذیه ثبت‌شده، پیشرفت و محدودیت‌هایی که خودت وارد کرده‌ای راهنمایی‌ات کنم. اگر بخواهی، برای آموزش حرکات ویدیو هم پیدا می‌کنم.',
};

const prompts = [
  'وضعیت تمرین‌های اخیرم را جمع‌بندی کن',
  'امروز از نظر تغذیه چه چیزی ثبت کرده‌ام؟',
  'یک ویدیوی آموزش اسکوات پیدا کن',
];

function faSeconds(value: number) {
  return new Intl.NumberFormat('fa-IR').format(Math.max(0, value));
}

function YouTubeCards({ videos }: { videos: readonly YouTubeVideoCard[] }) {
  if (videos.length === 0) return <p className="coach-youtube-empty">ویدیوی مناسبی پیدا نشد.</p>;
  return (
    <div className="coach-youtube-grid" aria-label="نتایج ویدیو">
      {videos.map((video) => (
        <a className="coach-youtube-card" href={video.watchUrl} target="_blank" rel="noreferrer noopener" key={video.videoId}>
          <div className="coach-youtube-card__media">
            {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" loading="lazy" /> : <span aria-hidden="true">▶</span>}
            {video.durationLabel ? <b>{video.durationLabel}</b> : null}
          </div>
          <div className="coach-youtube-card__body"><strong>{video.title}</strong><span>{video.channelTitle || 'YouTube'}</span></div>
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
    () => messages.filter((item) => item.id !== 'welcome').slice(-6).map(({ role, content }) => ({ role, content })),
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
          throw new Error(`درخواست‌ها موقتاً محدود شده‌اند. حدود ${faSeconds(retrySeconds)} ثانیه دیگر دوباره امتحان کن.`);
        }
        if (payload.error === 'youtube_not_configured') {
          setErrorAction({ href: '/profile/integrations', label: 'تنظیم اتصال ویدیو' });
          throw new Error('برای جست‌وجوی ویدیو، اتصال YouTube را از تنظیمات فعال کن.');
        }
        if (payload.error === 'youtube_video_requires_google') {
          setErrorAction({ href: '/profile/ai', label: 'تنظیم مربی هوشمند' });
          throw new Error('بررسی محتوای مستقیم یک لینک ویدیو فعلاً به اتصال Google نیاز دارد.');
        }
        if (response.status === 503 && payload.error === 'ai_not_configured') {
          setErrorAction({ href: '/profile/ai', label: 'تنظیم مربی هوشمند' });
          throw new Error('برای استفاده از مربی هوشمند، اتصال هوش مصنوعی را در تنظیمات فعال کن.');
        }
        if (response.status === 401 && payload.error === 'authentication_required') {
          setErrorAction({ href: '/auth', label: 'ورود دوباره' });
          throw new Error('نشست حسابت منقضی شده است. دوباره وارد حساب شو.');
        }
        if (payload.error === 'ai_provider_unavailable') {
          setErrorAction({ href: '/profile/ai', label: 'بررسی اتصال هوش مصنوعی' });
          throw new Error('مربی هوشمند پاسخ نداد. اتصال هوش مصنوعی را بررسی کن و دوباره تلاش کن.');
        }
        if (payload.error === 'youtube_tool_unavailable') {
          setErrorAction({ href: '/profile/integrations', label: 'بررسی اتصال ویدیو' });
          throw new Error('جست‌وجوی ویدیو موقتاً در دسترس نیست. کمی بعد دوباره تلاش کن.');
        }
        throw new Error('پاسخ مربی در دسترس نبود. دوباره تلاش کن.');
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
      setError(caught instanceof Error ? caught.message : 'پاسخ مربی در دسترس نبود.');
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
          <p className="section-kicker">مربی NeoFit</p>
          <h2 id="coach-heading">هر چیزی درباره برنامه‌ات بپرس</h2>
          <p>مربی از اطلاعاتی که در حسابت ثبت کرده‌ای برای پاسخ مرتبط‌تر استفاده می‌کند و بدون تأیید تو چیزی را تغییر نمی‌دهد.</p>
        </div>
      </header>

      {!account ? (
        <article className="coach-auth-card">
          <h3>برای استفاده از مربی وارد حساب شو</h3>
          <p>بعد از ورود، مربی می‌تواند پاسخ را با اطلاعات و برنامه خودت هماهنگ کند.</p>
          <Link href="/auth">ورود یا ساخت حساب</Link>
        </article>
      ) : (
        <>
          <div className="coach-prompts">
            {prompts.map((prompt) => <button type="button" key={prompt} disabled={blocked} onClick={() => void sendMessage(prompt)}>{prompt}</button>)}
          </div>

          <div className="coach-thread" aria-live="polite" aria-relevant="additions">
            {messages.map((message) => (
              <article key={message.id} className={message.role === 'user' ? 'coach-message coach-message--user' : 'coach-message coach-message--assistant'}>
                <div className="coach-message__text">{message.content}</div>
                {message.youtube?.mode === 'search' && message.youtube.videos ? <YouTubeCards videos={message.youtube.videos} /> : null}
                {message.youtube?.mode === 'video' && message.youtube.url ? (
                  <a className="coach-video-source" href={message.youtube.url} target="_blank" rel="noreferrer noopener">باز کردن ویدیو در YouTube</a>
                ) : null}
              </article>
            ))}
            {loading ? <article className="coach-message coach-message--assistant"><div className="coach-thinking"><span aria-hidden="true" />در حال آماده‌کردن پاسخ...</div></article> : null}
            <div ref={endRef} />
          </div>

          {cooldownSeconds > 0 ? <p className="coach-cooldown" role="status">ارسال بعدی تا {faSeconds(cooldownSeconds)} ثانیه دیگر</p> : null}
          {error ? <div className="coach-error" role="alert"><span>{error}</span>{errorAction ? <Link href={errorAction.href}>{errorAction.label}</Link> : null}</div> : null}

          <form className="coach-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="coach-message-input">پیام به مربی NeoFit</label>
            <textarea
              id="coach-message-input"
              value={input}
              maxLength={2400}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={composerKeyDown}
              placeholder="مثلاً: برنامه امروز را توضیح بده یا یک آموزش اسکوات پیدا کن..."
              disabled={blocked}
            />
            <button type="submit" disabled={blocked || !input.trim()}>{loading ? 'در حال پاسخ...' : 'ارسال'}</button>
          </form>
          <p className="coach-composer-hint">Enter خط جدید · Ctrl/⌘ + Enter ارسال</p>
          <p className="coach-boundary">مربی پیشنهاد و راهنمایی می‌دهد؛ تغییرات مهم فقط با اقدام و تأیید خودت انجام می‌شوند.</p>
        </>
      )}
    </section>
  );
}
