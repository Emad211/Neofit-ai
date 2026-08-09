import { NextResponse } from 'next/server';
import { AI_INPUT_LIMIT, AI_SYSTEM_INSTRUCTION_LIMIT } from '@/lib/ai/config';
import { generateWithProviderFallback } from '@/lib/ai/provider-router';
import { ProviderRequestError } from '@/lib/ai/provider-error';
import { AiBudgetExceededError, AiBudgetUnavailableError } from '@/lib/ai/request-audit';
import { isSameOriginBrowserMutation } from '@/lib/auth/request-origin';

export const dynamic = 'force-dynamic';

function budgetExceeded(error: AiBudgetExceededError) {
  return NextResponse.json({
    error: 'ai_request_budget_exceeded',
    retryAfterSeconds: error.retryAfterSeconds,
  }, {
    status: 429,
    headers: {
      'Cache-Control': 'private, no-store',
      'Retry-After': String(error.retryAfterSeconds),
    },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginBrowserMutation(request)) {
    return NextResponse.json({ error: 'cross_origin_request' }, {
      status: 403,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const input = typeof record.input === 'string' ? record.input.trim() : '';
  const systemInstruction = typeof record.systemInstruction === 'string'
    ? record.systemInstruction.trim()
    : undefined;

  if (!input || input.length > AI_INPUT_LIMIT) {
    return NextResponse.json({ error: 'input_invalid' }, { status: 400 });
  }
  if (systemInstruction && systemInstruction.length > AI_SYSTEM_INSTRUCTION_LIMIT) {
    return NextResponse.json({ error: 'system_instruction_invalid' }, { status: 400 });
  }

  try {
    const result = await generateWithProviderFallback({ input, systemInstruction }, undefined, 'respond');
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof AiBudgetExceededError) return budgetExceeded(error);
    if (error instanceof AiBudgetUnavailableError) {
      return NextResponse.json({ error: 'ai_request_budget_unavailable' }, { status: 503 });
    }
    if (error instanceof ProviderRequestError) {
      const status = error.kind === 'rate_limit' ? 429 : error.kind === 'auth' ? 401 : 502;
      return NextResponse.json({ error: 'ai_provider_unavailable', code: error.code }, { status });
    }
    return NextResponse.json({ error: 'ai_not_configured' }, { status: 503 });
  }
}
