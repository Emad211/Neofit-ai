import { NextResponse } from 'next/server';
import { listStoredCredentials } from '@/lib/ai/credential-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { credentials } = await listStoredCredentials();
    return NextResponse.json({
      providers: credentials.map(({ ciphertext, iv, authTag, keyVersion, userId, ...metadata }) => metadata),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'authentication_required' }, { status: 401 });
  }
}
