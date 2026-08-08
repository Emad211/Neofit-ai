import { NextResponse } from 'next/server';
import { authenticatedAiContext } from '@/lib/ai/credential-store';
import { ProviderRequestError } from '@/lib/ai/provider-error';
import { generateWithProviderFallback } from '@/lib/ai/provider-router';
import { isSameOriginBrowserMutation } from '@/lib/auth/request-origin';
import { loadCoachContext } from '@/lib/coach/context-loader';
import { routeCoachDomains } from '@/lib/coach/context-router';
import { buildCoachInput, COACH_MESSAGE_LIMIT, parseCoachHistory } from '@/lib/coach/request';
import { buildCoachSystemInstruction } from '@/lib/coach/system-prompt';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSameOriginBrowserMutation(request)) {
    return NextResponse.json({ error: 'cross_origin_request' }, {
      status: 403,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const message = typeof record.message === 'string' ? record.message.trim() : '';
  if (!message || message.length > COACH_MESSAGE_LIMIT) return NextResponse.json({ error: 'message_invalid' }, { status: 400 });
  const history = parseCoachHistory(record.history);

  let auth;
  try { auth = await authenticatedAiContext(); }
  catch { return NextResponse.json({ error: 'authentication_required' }, { status: 401 }); }

  const domains = routeCoachDomains(message);
  try {
    const context = await loadCoachContext(auth, domains);
    const result = await generateWithProviderFallback({
      input: buildCoachInput(history, message),
      systemInstruction: buildCoachSystemInstruction(context, domains),
    }, auth);
    return NextResponse.json({
      answer: result.text,
      meta: { provider: result.provider, modelId: result.modelId, latencyMs: result.latencyMs, fallbackFrom: result.fallbackFrom, contextDomains: domains },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof ProviderRequestError) {
      const status = error.kind === 'rate_limit' ? 429 : error.kind === 'auth' ? 401 : 502;
      return NextResponse.json({ error: 'ai_provider_unavailable', code: error.code }, { status });
    }
    const messageText = error instanceof Error ? error.message : '';
    if (messageText.includes('No active AI provider credential')) return NextResponse.json({ error: 'ai_not_configured' }, { status: 503 });
    return NextResponse.json({ error: 'coach_context_unavailable' }, { status: 503 });
  }
}
