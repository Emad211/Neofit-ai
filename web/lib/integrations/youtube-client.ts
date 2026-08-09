import 'server-only';

import type { YouTubeSearchToolResult, YouTubeVideoCard } from './types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_TIMEOUT_MS = 10000;
const MAX_SEARCH_RESULTS = 4;
const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;

export class YouTubeRequestError extends Error {
  readonly kind: 'auth' | 'rate_limit' | 'invalid_request' | 'transient';
  readonly code: string;

  constructor(input: {
    kind: YouTubeRequestError['kind'];
    code: string;
  }) {
    super(input.code);
    this.name = 'YouTubeRequestError';
    this.kind = input.kind;
    this.code = input.code.slice(0, 120);
  }
}

async function fetchWithTimeout(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), YOUTUBE_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new YouTubeRequestError({ kind: 'transient', code: 'youtube_network_error' });
  } finally {
    clearTimeout(timer);
  }
}

async function youtubeJson<T>(url: URL, operation: string): Promise<T> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    const kind = response.status === 400
      ? 'invalid_request'
      : response.status === 401 || response.status === 403
        ? 'auth'
        : response.status === 429
          ? 'rate_limit'
          : 'transient';
    throw new YouTubeRequestError({ kind, code: `${operation}_${response.status}` });
  }
  try {
    return await response.json() as T;
  } catch {
    throw new YouTubeRequestError({ kind: 'transient', code: `${operation}_invalid_json` });
  }
}

function apiUrl(path: 'videos' | 'search', apiKey: string): URL {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  url.searchParams.set('key', apiKey);
  return url;
}

function parseIsoDuration(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const [, days, hours, minutes, seconds] = match;
  const total = (Number(days ?? 0) * 86400)
    + (Number(hours ?? 0) * 3600)
    + (Number(minutes ?? 0) * 60)
    + Number(seconds ?? 0);
  return Number.isFinite(total) && total >= 0 ? total : null;
}

function durationLabel(seconds: number | null): string | null {
  if (seconds === null) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${minutes}:${String(secs).padStart(2, '0')}`;
}

interface SearchPayload {
  readonly items?: Array<{
    readonly id?: { readonly videoId?: string };
    readonly snippet?: {
      readonly title?: string;
      readonly channelTitle?: string;
      readonly publishedAt?: string;
      readonly thumbnails?: {
        readonly medium?: { readonly url?: string };
        readonly default?: { readonly url?: string };
      };
    };
  }>;
}

interface VideosPayload {
  readonly items?: Array<{
    readonly id?: string;
    readonly contentDetails?: { readonly duration?: string };
    readonly snippet?: { readonly title?: string };
  }>;
}

export async function validateYouTubeApiKey(apiKey: string): Promise<void> {
  const url = apiUrl('videos', apiKey);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('chart', 'mostPopular');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('regionCode', 'US');
  await youtubeJson<VideosPayload>(url, 'youtube_validate');
}

export async function searchYouTubeVideos(apiKey: string, rawQuery: string): Promise<YouTubeSearchToolResult> {
  const query = rawQuery.replace(/\s+/g, ' ').trim().slice(0, 120);
  if (query.length < 2) {
    throw new YouTubeRequestError({ kind: 'invalid_request', code: 'youtube_query_invalid' });
  }

  const startedAt = performance.now();
  const searchUrl = apiUrl('search', apiKey);
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('maxResults', String(MAX_SEARCH_RESULTS));
  searchUrl.searchParams.set('order', 'relevance');
  searchUrl.searchParams.set('safeSearch', 'strict');
  searchUrl.searchParams.set('relevanceLanguage', 'fa');
  searchUrl.searchParams.set('videoEmbeddable', 'true');
  searchUrl.searchParams.set('videoSyndicated', 'true');

  const search = await youtubeJson<SearchPayload>(searchUrl, 'youtube_search');
  const candidates = (search.items ?? [])
    .map((item) => ({
      videoId: item.id?.videoId ?? '',
      title: item.snippet?.title?.trim() ?? '',
      channelTitle: item.snippet?.channelTitle?.trim() ?? '',
      publishedAt: item.snippet?.publishedAt ?? null,
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url
        ?? item.snippet?.thumbnails?.default?.url
        ?? null,
    }))
    .filter((item) => VIDEO_ID.test(item.videoId) && item.title.length > 0)
    .slice(0, MAX_SEARCH_RESULTS);

  if (candidates.length === 0) {
    return { query, videos: [], latencyMs: Math.round(performance.now() - startedAt) };
  }

  const detailsUrl = apiUrl('videos', apiKey);
  detailsUrl.searchParams.set('part', 'contentDetails');
  detailsUrl.searchParams.set('id', candidates.map((item) => item.videoId).join(','));
  const details = await youtubeJson<VideosPayload>(detailsUrl, 'youtube_videos');
  const durations = new Map(
    (details.items ?? [])
      .filter((item) => typeof item.id === 'string')
      .map((item) => [item.id as string, parseIsoDuration(item.contentDetails?.duration)]),
  );

  const videos: YouTubeVideoCard[] = candidates.map((item) => {
    const durationSeconds = durations.get(item.videoId) ?? null;
    return {
      ...item,
      durationSeconds,
      durationLabel: durationLabel(durationSeconds),
      watchUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
    };
  });

  return {
    query,
    videos,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}
