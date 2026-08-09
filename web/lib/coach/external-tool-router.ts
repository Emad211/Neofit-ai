export type CoachExternalToolIntent =
  | { readonly kind: 'none' }
  | { readonly kind: 'youtube_video'; readonly url: string }
  | { readonly kind: 'youtube_search'; readonly query: string };

const YOUTUBE_INTENT = /(?:یوتیوب|youtube|وید[یئ]و|فیلم\s*آموزشی|آموزش\s*وید[یئ]ویی|tutorial)/i;
const SEARCH_INTENT = /(?:پیدا\s*کن|پیشنهاد\s*بده|معرفی\s*کن|بگرد|جست(?:جو|‌وجو)|search|find|recommend)/i;

function normalizedYouTubeUrl(raw: string): string | null {
  const candidate = raw.replace(/[),.،؛!?؟]+$/g, '');
  let url: URL;
  try { url = new URL(candidate); }
  catch { return null; }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  let videoId = '';
  if (host === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? '';
  } else if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v') ?? '';
    else {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' || parts[0] === 'live') videoId = parts[1] ?? '';
    }
  }

  if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function extractYouTubeUrl(message: string): string | null {
  const urls = message.match(/https?:\/\/[^\s<>]+/gi) ?? [];
  for (const raw of urls) {
    const normalized = normalizedYouTubeUrl(raw);
    if (normalized) return normalized;
  }
  return null;
}

function searchQuery(message: string): string {
  return message
    .replace(/https?:\/\/[^\s<>]+/gi, ' ')
    .replace(/(?:یوتیوب|youtube|وید[یئ]و|فیلم\s*آموزشی|آموزش\s*وید[یئ]ویی|tutorial)/gi, ' ')
    .replace(/(?:لطفا|لطفاً|میشه|می‌شه|می شود|می‌شود|برام|برای من)/g, ' ')
    .replace(/(?:پیدا\s*کن|پیشنهاد\s*بده|معرفی\s*کن|بگرد|جست(?:جو|‌وجو)|search|find|recommend)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export function routeCoachExternalTool(message: string): CoachExternalToolIntent {
  const url = extractYouTubeUrl(message);
  if (url) return { kind: 'youtube_video', url };

  if (!YOUTUBE_INTENT.test(message) || !SEARCH_INTENT.test(message)) return { kind: 'none' };
  const query = searchQuery(message);
  return query.length >= 2 ? { kind: 'youtube_search', query } : { kind: 'none' };
}
