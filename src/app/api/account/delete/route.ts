import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticationError, requireUser } from '@/lib/server-auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function deleteLinkedPurchases(uid: string) {
  const db = getFirestore(getFirebaseAdmin());
  while (true) {
    const snapshot = await db.collection('billing_purchases').where('uid', '==', uid).limit(400).get();
    if (snapshot.empty) return;
    const batch = db.batch();
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
    if (snapshot.size < 400) return;
  }
}

export async function DELETE(request: Request) {
  try {
    const { uid } = await requireUser(request);
    const app = getFirebaseAdmin();
    const db = getFirestore(app);

    await Promise.all([
      db.recursiveDelete(db.collection('profiles').doc(uid)),
      db.collection('plans').doc(uid).delete(),
      db.collection('subscriptions').doc(uid).delete(),
      deleteLinkedPurchases(uid),
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
