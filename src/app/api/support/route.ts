import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  email: z.string().trim().email().max(320),
  category: z.enum(['account', 'billing', 'privacy', 'technical', 'other']),
  message: z.string().trim().min(20).max(4_000),
  locale: z.enum(['en', 'fa']).default('en'),
  website: z.string().max(0).optional(),
});

function requestIp(request: Request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}

function rateLimitHash(request: Request) {
  const secret = process.env.SUPPORT_RATE_LIMIT_SECRET || process.env.FIREBASE_PROJECT_ID || 'local-development';
  return createHash('sha256').update(`${secret}:${requestIp(request)}`).digest('hex');
}

function hourKey(date = new Date()) {
  return date.toISOString().slice(0, 13).replace(/[-T:]/g, '');
}

export async function POST(request: Request) {
  try {
    const input = RequestSchema.parse(await request.json());
    if (input.website) {
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const db = getFirestore(getFirebaseAdmin());
    const ipHash = rateLimitHash(request);
    const limitRef = db.collection('support_rate_limits').doc(`${hourKey()}-${ipHash}`);
    const ticketRef = db.collection('support_tickets').doc();

    await db.runTransaction(async (transaction) => {
      const limitSnapshot = await transaction.get(limitRef);
      const count = Number(limitSnapshot.data()?.count || 0);
      if (count >= 5) throw new Error('RATE_LIMIT');

      transaction.set(limitRef, {
        count: count + 1,
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1_000),
      }, { merge: true });
      transaction.set(ticketRef, {
        email: input.email.toLowerCase(),
        category: input.category,
        message: input.message,
        locale: input.locale,
        status: 'new',
        ipHash,
        userAgent: request.headers.get('user-agent')?.slice(0, 500) || null,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true, ticketId: ticketRef.id }, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid support request.', details: error.flatten() }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'RATE_LIMIT') {
      return NextResponse.json({ error: 'Too many support requests. Try again later.' }, { status: 429 });
    }
    console.error('Support request failed:', error);
    return NextResponse.json({ error: 'Support request could not be submitted.' }, { status: 500 });
  }
}
