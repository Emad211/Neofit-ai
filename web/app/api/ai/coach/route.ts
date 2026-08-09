import { NextResponse } from 'next/server';
import { authenticatedAiContext } from '@/lib/ai/credential-store';
import { ProviderRequestError } from '@/lib/ai/provider-error';
import { AiCapabilityUnavailableError, generateWithProviderFallback } from '@/lib/ai/provider-router';
import { AiBudgetExceededError, AiBudgetUnavailableError } from '@/lib/ai/request-audit';
import { isSameOriginBrowserMutation } from '@/lib/auth/request-origin';
import { loadCoachContext } from '@/lib/coach/context-loader';
import { routeCoachDomains } from '@/lib/coach/context-router';
import { routeCoachExternalTool } from '@/lib/coach/external-tool-router';
import { buildCoachInput, COACH_MESSAGE_LIMIT, parseCoachHistory } from '@/lib/coach/request';
import { buildCoachSystemInstruction, type CoachExternalContext } from '@/lib/coach/system-prompt';
import { AgentToolBudgetExceededError, AgentToolBudgetUnavailableError } from '@/lib/integrations/tool-audit';
import type { YouTubeVideoCard } from '@/lib/integrations/types';
import { YouTubeRequestError } from '@/lib/integrations/youtube-client';
import { runYouTubeSearchTool, YouTubeIntegrationNotConfiguredError } from '@/lib/integrations/youtube-tool';

export const dynamic = 'force-dynamic';

interface YouTubeToolData {
  readonly mode: 'search' | 'video';
  readonly videos?: readonly YouTubeVideoCard[];
  readonly url?: string;
}

function privateJson(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store', ...extraHeaders },
  });
}

function budgetExceeded(error: AiBudgetExceededError) {
  return privateJson({
    error: 'ai_request_budget_exceeded',
    retryAfterSeconds: error.retryAfterSeconds,
  }, 429, { 'Retry-After': String(error.retryAfterSeconds) });
}

export async function POST(request: Request) {
  if (!isSameOriginBrowserMutation(request)) {
    return privateJson({ error: 'cross_origin_request' }, 403);
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return privateJson({ error: 'invalid_json' }, 400); }

  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const message = typeof record.message === 'string' ? record.message.trim() : '';
  if (!message || message.length > COACH_MESSAGE_LIMIT) return privateJson({ error: 'message_invalid' }, 400);
  const history = parseCoachHistory(record.history);

  let auth;
  try { auth = await authenticatedAiContext(); }
  catch { return privateJson({ error: 'authentication_required' }, 401); }

  const domains = routeCoachDomains(message);
  const externalIntent = routeCoachExternalTool(message);
  let externalContext: CoachExternalContext | undefined;
  let toolData: { youtube?: YouTubeToolData } | undefined;
  let media: readonly { type: 'youtube_video'; url: string }[] | undefined;

  try {
    if (externalIntent.kind === 'youtube_search') {
      const youtube = await runYouTubeSearchTool(auth, externalIntent.query);
      externalContext = { youtube: { query: youtube.query, videos: youtube.videos } };
      toolData = { youtube: { mode: 'search', videos: youtube.videos } };
    } else if (externalIntent.kind === 'youtube_video') {
      media = [{ type: 'youtube_video', url: externalIntent.url }];
      toolData = { youtube: { mode: 'video', url: externalIntent.url } };
    }

    const context = await loadCoachContext(auth, domains);
    try {
      const result = await generateWithProviderFallback({
        input: buildCoachInput(history, message),
        systemInstruction: buildCoachSystemInstruction(context, domains, externalContext),
        ...(media ? { media } : {}),
      }, auth, 'coach');
      return privateJson({
        answer: result.text,
        meta: {
          provider: result.provider,
          modelId: result.modelId,
          latencyMs: result.latencyMs,
          fallbackFrom: result.fallbackFrom,
          contextDomains: domains,
        },
        ...(toolData ? { toolData } : {}),
      });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '';
      if (toolData?.youtube?.mode === 'search' && messageText.includes('No active AI provider credential')) {
        return privateJson({
          answer: toolData.youtube.videos?.length
            ? 'نتایج ویدیویی مرتبط پیدا شد. برای تحلیل یا توضیح هوشمند، کلید Google Gemini یا AvalAI را در تنظیمات هوش مصنوعی فعال کن.'
            : 'برای این جست‌وجو ویدیوی مناسبی پیدا نشد.',
          meta: { provider: null, modelId: null, latencyMs: null, fallbackFrom: null, contextDomains: domains },
          toolData,
        });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof YouTubeIntegrationNotConfiguredError) {
      return privateJson({ error: 'youtube_not_configured' }, 503);
    }
    if (error instanceof AgentToolBudgetExceededError) {
      return privateJson({
        error: 'youtube_tool_budget_exceeded',
        retryAfterSeconds: error.retryAfterSeconds,
      }, 429, { 'Retry-After': String(error.retryAfterSeconds) });
    }
    if (error instanceof AgentToolBudgetUnavailableError) {
      return privateJson({ error: 'youtube_tool_budget_unavailable' }, 503);
    }
    if (error instanceof YouTubeRequestError) {
      const status = error.kind === 'rate_limit' ? 429 : error.kind === 'auth' ? 401 : 502;
      return privateJson({ error: 'youtube_tool_unavailable', code: error.code }, status,
        error.kind === 'rate_limit' ? { 'Retry-After': '300' } : undefined);
    }
    if (error instanceof AiCapabilityUnavailableError) {
      return privateJson({ error: 'youtube_video_requires_google' }, 503);
    }
    if (error instanceof AiBudgetExceededError) return budgetExceeded(error);
    if (error instanceof AiBudgetUnavailableError) {
      return privateJson({ error: 'ai_request_budget_unavailable' }, 503);
    }
    if (error instanceof ProviderRequestError) {
      const status = error.kind === 'rate_limit' ? 429 : error.kind === 'auth' ? 401 : 502;
      return privateJson({ error: 'ai_provider_unavailable', code: error.code }, status);
    }
    const messageText = error instanceof Error ? error.message : '';
    if (messageText.includes('No active AI provider credential')) return privateJson({ error: 'ai_not_configured' }, 503);
    return privateJson({ error: 'coach_context_unavailable' }, 503);
  }
}
