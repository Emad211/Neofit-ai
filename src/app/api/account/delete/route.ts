import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticationError, requireUser } from '@/lib/server-auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    const { uid } = await requireUser(request);
    const app = getFirebaseAdmin();
    const db = getFirestore(app);

    await Promise.all([
      db.recursiveDelete(db.collection('profiles').doc(uid)),
      db.collection('plans').doc(uid).delete(),
      db.collection('subscriptions').doc(uid).delete(),
    ]);
    await getAuth(app).deleteUser(uid);

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Account deletion failed:', error);
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
  }
}
