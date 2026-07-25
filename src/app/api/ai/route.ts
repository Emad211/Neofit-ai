import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AiActionSchema } from '@/ai/schemas';
import { AvalAiError } from '@/lib/avalai';
import { AuthenticationError, requireUser } from '@/lib/server-auth';
import { runAiAction, isValidationError } from '@/lib/ai-actions-server';
import { consumeAiQuota, QuotaExceededError } from '@/lib/server-usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  action: AiActionSchema,
  input: z.unknown(),
});

function errorResponse(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const payload = RequestSchema.parse(await request.json());
    const quota = await consumeAiQuota(user.uid, payload.action);
    const result = await runAiAction(payload.action, payload.input, user.uid);

    return NextResponse.json({
      data: result.data,
      meta: {
        quota,
        avalai: result.metadata,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    if (error instanceof QuotaExceededError) {
      return errorResponse(error.message, 429, {
        planId: error.planId,
        limit: error.limit,
        upgradeRequired: true,
      });
    }
    if (isValidationError(error)) {
      return errorResponse('Invalid request data.', 400, error.flatten());
    }
    if (error instanceof AvalAiError) {
      return errorResponse(error.message, error.status >= 400 && error.status < 600 ? error.status : 502, {
        requestId: error.requestId,
      });
    }

    console.error('Unhandled AI route error:', error);
    return errorResponse('The AI service is temporarily unavailable.', 500);
  }
}
