'use client';

import { getAuth } from 'firebase/auth';
import { AiAction } from '@/ai/schemas';
import { app } from '@/lib/firebase';

export class AiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AiClientError';
  }
}

export async function callAi<T>(action: AiAction, input: unknown): Promise<T> {
  const user = getAuth(app).currentUser;
  if (!user) throw new AiClientError('Authentication required.', 401);

  const token = await user.getIdToken();
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, input }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null) as {
    data?: T;
    error?: string;
    details?: unknown;
  } | null;

  if (!response.ok || !payload?.data) {
    throw new AiClientError(
      payload?.error || 'AI request failed.',
      response.status,
      payload?.details,
    );
  }

  return payload.data;
}
