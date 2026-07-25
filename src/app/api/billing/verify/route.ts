import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { AuthenticationError, requireUser } from '@/lib/server-auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import {
  encryptPurchaseToken,
  purchaseTokenHash,
  verifyStorePurchase,
} from '@/lib/billing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  provider: z.enum(['google_play', 'cafebazaar', 'myket']),
  productId: z.string().trim().min(1).max(200),
  purchaseToken: z.string().trim().min(10).max(10_000),
  packageName: z.string().trim().min(3).max(300),
  orderId: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const { uid } = await requireUser(request);
    const input = RequestSchema.parse(await request.json());
    const verified = await verifyStorePurchase(input);
    const tokenHash = purchaseTokenHash(input.provider, input.purchaseToken);
    const encryptedToken = encryptPurchaseToken(input.purchaseToken);
    const db = getFirestore(getFirebaseAdmin());
    const purchaseRef = db.collection('billing_purchases').doc(`${input.provider}-${tokenHash}`);
    const subscriptionRef = db.collection('subscriptions').doc(uid);

    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(purchaseRef);
      const existingUid = existing.data()?.uid;
      if (existingUid && existingUid !== uid) {
        throw new Error('This store purchase is already linked to another account.');
      }

      transaction.set(purchaseRef, {
        uid,
        provider: verified.provider,
        planId: verified.planId,
        productId: verified.productId,
        packageName: verified.packageName,
        orderId: verified.orderId,
        tokenHash,
        encryptedToken,
        activeUntil: Timestamp.fromDate(verified.activeUntil),
        autoRenewing: verified.autoRenewing,
        rawState: verified.rawState,
        verifiedAt: FieldValue.serverTimestamp(),
        createdAt: existing.exists ? existing.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      }, { merge: true });

      transaction.set(subscriptionRef, {
        planId: verified.planId,
        status: 'active',
        provider: verified.provider,
        productId: verified.productId,
        purchaseRef: purchaseRef.path,
        activeUntil: Timestamp.fromDate(verified.activeUntil),
        autoRenewing: verified.autoRenewing,
        storeState: verified.status,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    return NextResponse.json({
      planId: verified.planId,
      activeUntil: verified.activeUntil.toISOString(),
      status: verified.status,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid purchase data.', details: error.flatten() }, { status: 400 });
    }
    console.error('Purchase verification failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Purchase verification failed.',
    }, { status: 400 });
  }
}
