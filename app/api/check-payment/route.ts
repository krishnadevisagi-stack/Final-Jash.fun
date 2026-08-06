import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreDB } from '../../../lib/firestore';
import { readPaymentsFallback } from '../../../lib/fallback-storage';
import { isValidEmail } from '../../../lib/input-validator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const rawEmail = url.searchParams.get('email');
    const email = rawEmail?.toLowerCase().trim();

    if (!rawEmail || !isValidEmail(rawEmail)) {
      return NextResponse.json({ success: false, error: 'Valid email parameter is required' }, { status: 400 });
    }

    let foundPayment: any = null;
    let firestoreQueryFailed = false;

    // 1. Try Firestore
    try {
      console.log(`[Firestore] Checking unused payments for email: ${email}`);
      const db = getFirestoreDB();
      const snapshot = await db.collection('verified_payments')
        .where('email', '==', email)
        .where('used', '==', false)
        .get();

      if (!snapshot.empty) {
        // Find the most recent unused payment
        const docs: any[] = [];
        snapshot.forEach((doc: any) => {
          docs.push(doc.data());
        });
        
        // Sort by createdAt descending if possible
        docs.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });

        foundPayment = docs[0];
        console.log(`[Firestore] Found unused payment in Firestore: ${foundPayment.paymentId}`);
      } else {
        console.log(`[Firestore] No unused payments found for email: ${email}`);
      }
    } catch (firestoreErr: any) {
      firestoreQueryFailed = true;
      console.error('[Firestore Errors] Failed to check payments in Firestore:', firestoreErr);
    }

    // 2. Local Fallback
    if (!foundPayment) {
      if (firestoreQueryFailed) {
        console.warn('Firestore failed. Checking local fallback payments.');
      } else {
        console.log('No active payment found in Firestore. Checking local fallback payments.');
      }
      const payments = readPaymentsFallback();
      const unusedLocal = payments.filter(p => p.email === email && p.used === false);
      if (unusedLocal.length > 0) {
        unusedLocal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        foundPayment = unusedLocal[0];
        console.log(`[Local Fallback] Found unused payment: ${foundPayment.paymentId}`);
      }
    }

    if (foundPayment) {
      return NextResponse.json({
        success: true,
        verified: true,
        paymentId: foundPayment.paymentId,
        orderId: foundPayment.orderId,
        amount: foundPayment.amount,
      });
    }

    return NextResponse.json({
      success: true,
      verified: false,
    });
  } catch (error: any) {
    console.error('Error in GET /api/check-payment:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// sync
