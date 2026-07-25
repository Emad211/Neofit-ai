import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticationError, requireUser } from '@/lib/server-auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { uid } = await requireUser(request);
    const db = getFirestore(getFirebaseAdmin());
    const profileRef = db.collection('profiles').doc(uid);

    await Promise.all([
      db.recursiveDelete(profileRef),
      db.collection('plans').doc(uid).delete(),
    ]);

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Profile reset failed:', error);
    return NextResponse.json({ error: 'Failed to reset profile data.' }, { status: 500 });
  }
}
