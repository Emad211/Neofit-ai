import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function saveWeeklyReport(params: {
  userId: string;
  analysisReport: string;
  requestId?: string | null;
}) {
  const db = getFirestore(getFirebaseAdmin());
  const reportRef = db.collection('profiles').doc(params.userId).collection('weekly_reports').doc();
  await reportRef.set({
    reportDate: FieldValue.serverTimestamp(),
    reportText: params.analysisReport,
    avalaiRequestId: params.requestId || null,
  });

  return { reportId: reportRef.id, status: 'success' as const };
}
