import { fetch } from 'expo/fetch';
import { z } from 'zod';
import { Exercise, ExerciseVideo, ExerciseVideoSchema } from '@/domain/models';
import {
  getExerciseVideoCache,
  saveExerciseVideoCache,
} from '@/db/exercise-video-repository';
import { getYouTubeApiKey } from '@/services/secure-settings';

const SearchResponseSchema = z.object({
  items: z.array(z.object({
    id: z.object({ videoId: z.string() }),
    snippet: z.object({
      title: z.string(),
      channelTitle: z.string(),
      publishedAt: z.string().optional(),
      thumbnails: z.object({
        high: z.object({ url: z.string().url() }).optional(),
        medium: z.object({ url: z.string().url() }).optional(),
        default: z.object({ url: z.string().url() }).optional(),
      }),
    }),
  })).default([]),
});

const VideosResponseSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    snippet: z.object({
      title: z.string(),
      channelTitle: z.string(),
      publishedAt: z.string().optional(),
      thumbnails: z.object({
        high: z.object({ url: z.string().url() }).optional(),
        medium: z.object({ url: z.string().url() }).optional(),
        default: z.object({ url: z.string().url() }).optional(),
      }),
    }),
    contentDetails: z.object({ duration: z.string().default('PT0S') }),
    status: z.object({
      embeddable: z.boolean().default(false),
      privacyStatus: z.string().default('private'),
    }),
    statistics: z.object({ viewCount: z.string().optional() }).optional(),
  })).default([]),
});

export class YouTubeAgentError extends Error {
  constructor(
    message: string,
    public readonly code: 'MISSING_API_KEY' | 'QUOTA' | 'HTTP' | 'NETWORK' | 'NO_RESULTS' | 'INVALID_RESPONSE',
    public readonly status = 0,
  ) {
    super(message);
    this.name = 'YouTubeAgentError';
  }
}

function normalize(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeTitle(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stableHash(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

function parseIsoDuration(value: string) {
  const match = value.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = match;
  return Number(days) * 86_400 + Number(hours) * 3_600 + Number(minutes) * 60 + Number(seconds);
}

function thumbnailOf(thumbnails: {
  high?: { url: string } | undefined;
  medium?: { url: string } | undefined;
  default?: { url: string } | undefined;
}) {
  return thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';
}

function queryForExercise(exercise: Exercise, locale: 'fa' | 'en') {
  const configured = exercise.videoSearchQueries[locale]
    .map((value) => value.trim())
    .find((value) => value.length > 1 && !value.includes('exercise tutorial proper form'));
  if (configured) return configured;

  const canonical = locale === 'fa'
    ? exercise.canonicalNameFa || exercise.name
    : exercise.canonicalNameEn || exercise.name;
  return locale === 'fa'
    ? `آموزش ${canonical} فرم صحیح نحوه اجرا`
    : `${canonical} exercise tutorial proper form technique`;
}

function scoreVideo(input: {
  title: string;
  channelTitle: string;
  query: string;
  exercise: Exercise;
  locale: 'fa' | 'en';
  durationSeconds: number;
  viewCount: number;
}) {
  const title = normalize(input.title);
  const queryTokens = normalize(input.query).split(' ').filter((token) => token.length > 2);
  const exerciseTokens = normalize([
    input.exercise.canonicalNameEn,
    input.exercise.canonicalNameFa,
    input.exercise.name,
  ].join(' ')).split(' ').filter((token) => token.length > 2);
  const positive = input.locale === 'fa'
    ? ['آموزش', 'فرم صحیح', 'نحوه اجرا', 'تکنیک', 'اشتباه', 'بدنسازی']
    : ['tutorial', 'proper form', 'how to', 'technique', 'mistakes', 'exercise'];
  const negative = input.locale === 'fa'
    ? ['چالش', 'سرگرمی', 'واکنش', 'موزیک', 'شورت']
    : ['challenge', 'reaction', 'compilation', 'motivation', 'shorts', 'music'];

  let score = 0;
  for (const token of new Set([...queryTokens, ...exerciseTokens])) {
    if (title.includes(token)) score += 4;
  }
  for (const phrase of positive) if (title.includes(normalize(phrase))) score += 5;
  for (const phrase of negative) if (title.includes(normalize(phrase))) score -= 14;

  if (input.durationSeconds >= 60 && input.durationSeconds <= 900) score += 10;
  else if (input.durationSeconds >= 30 && input.durationSeconds <= 1_200) score += 4;
  else if (input.durationSeconds < 20 || input.durationSeconds > 2_400) score -= 10;

  score += Math.min(8, Math.log10(Math.max(1, input.viewCount)));
  if (/official|academy|university|hospital|clinic|physio|strength|fitness/i.test(input.channelTitle)) score += 2;
  return Math.round(score * 100) / 100;
}

function errorFromResponse(status: number, payload: unknown) {
  const candidate = payload as {
    error?: { message?: string; errors?: Array<{ reason?: string }> };
  } | null;
  const reason = candidate?.error?.errors?.[0]?.reason || '';
  const message = candidate?.error?.message || `YouTube request failed with status ${status}.`;
  if (status === 403 && /quota/i.test(`${reason} ${message}`)) {
    return new YouTubeAgentError(message, 'QUOTA', status);
  }
  return new YouTubeAgentError(message, 'HTTP', status);
}

async function fetchJson(url: string) {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => null) as unknown;
    if (!response.ok) throw errorFromResponse(response.status, payload);
    return payload;
  } catch (error) {
    if (error instanceof YouTubeAgentError) throw error;
    throw new YouTubeAgentError(
      error instanceof Error ? error.message : 'YouTube network request failed.',
      'NETWORK',
    );
  }
}

async function searchYouTube(input: {
  apiKey: string;
  query: string;
  exercise: Exercise;
  locale: 'fa' | 'en';
}) {
  const searchParameters = new URLSearchParams({
    part: 'snippet',
    q: input.query,
    type: 'video',
    maxResults: '12',
    safeSearch: 'moderate',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    relevanceLanguage: input.locale,
    regionCode: input.locale === 'fa' ? 'IR' : 'US',
    key: input.apiKey,
  });
  const searchPayload = SearchResponseSchema.safeParse(await fetchJson(
    `https://www.googleapis.com/youtube/v3/search?${searchParameters.toString()}`,
  ));
  if (!searchPayload.success) {
    throw new YouTubeAgentError('YouTube search returned an invalid response.', 'INVALID_RESPONSE', 502);
  }

  const videoIds = searchPayload.data.items.map((item) => item.id.videoId).filter(Boolean);
  if (videoIds.length === 0) return [];

  const detailsParameters = new URLSearchParams({
    part: 'snippet,contentDetails,status,statistics',
    id: videoIds.join(','),
    key: input.apiKey,
  });
  const detailsPayload = VideosResponseSchema.safeParse(await fetchJson(
    `https://www.googleapis.com/youtube/v3/videos?${detailsParameters.toString()}`,
  ));
  if (!detailsPayload.success) {
    throw new YouTubeAgentError('YouTube video details returned an invalid response.', 'INVALID_RESPONSE', 502);
  }

  const searchSnippet = new Map(searchPayload.data.items.map((item) => [item.id.videoId, item.snippet]));
  const candidates: ExerciseVideo[] = detailsPayload.data.items
    .filter((item) => item.status.embeddable && item.status.privacyStatus === 'public')
    .map((item) => {
      const fallbackSnippet = searchSnippet.get(item.id);
      const thumbnailUrl = thumbnailOf(item.snippet.thumbnails) || (fallbackSnippet ? thumbnailOf(fallbackSnippet.thumbnails) : '');
      const durationSeconds = parseIsoDuration(item.contentDetails.duration);
      const viewCount = Math.max(0, Number(item.statistics?.viewCount || 0));
      return ExerciseVideoSchema.parse({
        videoId: item.id,
        title: decodeTitle(item.snippet.title),
        channelTitle: decodeTitle(item.snippet.channelTitle),
        thumbnailUrl,
        publishedAt: item.snippet.publishedAt || null,
        durationSeconds,
        viewCount: Number.isFinite(viewCount) ? Math.round(viewCount) : 0,
        score: scoreVideo({
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          query: input.query,
          exercise: input.exercise,
          locale: input.locale,
          durationSeconds,
          viewCount,
        }),
        query: input.query,
      });
    })
    .filter((video) => Boolean(video.thumbnailUrl))
    .sort((a, b) => b.score - a.score || b.viewCount - a.viewCount)
    .slice(0, 8);

  return candidates;
}

export function getExerciseVideoCacheKey(exercise: Exercise, locale: 'fa' | 'en') {
  const canonicalIdentity = normalize([
    exercise.canonicalNameEn,
    exercise.canonicalNameFa,
    exercise.name,
  ].filter(Boolean).join('|'));
  return `youtube-exercise-${stableHash(`${locale}|${canonicalIdentity}`)}`;
}

export async function findExerciseTutorials(input: {
  exercise: Exercise;
  locale: 'fa' | 'en';
  forceRefresh?: boolean;
}) {
  const query = queryForExercise(input.exercise, input.locale);
  const cacheKey = getExerciseVideoCacheKey(input.exercise, input.locale);
  if (!input.forceRefresh) {
    const cached = await getExerciseVideoCache(cacheKey);
    if (cached?.videos.length) return cached;
  }

  const apiKey = await getYouTubeApiKey();
  if (!apiKey) {
    throw new YouTubeAgentError('YouTube Data API key is not configured on this device.', 'MISSING_API_KEY', 401);
  }

  const videos = await searchYouTube({
    apiKey,
    query,
    exercise: input.exercise,
    locale: input.locale,
  });
  if (videos.length === 0) {
    throw new YouTubeAgentError('No embeddable tutorial video matched this exercise.', 'NO_RESULTS', 404);
  }

  return saveExerciseVideoCache({
    cacheKey,
    exerciseId: input.exercise.id,
    query,
    locale: input.locale,
    videos,
    ttlMs: 60 * 86_400_000,
  });
}

export async function testYouTubeConnection() {
  const apiKey = await getYouTubeApiKey();
  if (!apiKey) {
    throw new YouTubeAgentError('YouTube Data API key is missing.', 'MISSING_API_KEY', 401);
  }
  const parameters = new URLSearchParams({
    part: 'snippet',
    q: 'squat exercise tutorial proper form',
    type: 'video',
    maxResults: '1',
    safeSearch: 'moderate',
    videoEmbeddable: 'true',
    key: apiKey,
  });
  const parsed = SearchResponseSchema.safeParse(await fetchJson(
    `https://www.googleapis.com/youtube/v3/search?${parameters.toString()}`,
  ));
  if (!parsed.success) {
    throw new YouTubeAgentError('YouTube test returned an invalid response.', 'INVALID_RESPONSE', 502);
  }
  return { resultCount: parsed.data.items.length };
}

export function exerciseYouTubeSearchUrl(exercise: Exercise, locale: 'fa' | 'en') {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(queryForExercise(exercise, locale))}`;
}

export function exerciseYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0&enablejsapi=0`;
}
