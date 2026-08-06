import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestoreDB } from '../../../lib/firestore';
import { readPaymentsFallback, writePaymentsFallback } from '../../../lib/fallback-storage';

import { isValidEmail, isValidId } from '../../../lib/input-validator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, amount } = body;

    if (!isValidId(razorpay_order_id, 128) || !isValidId(razorpay_payment_id, 128) || !isValidId(razorpay_signature, 256) || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Missing or invalid payment verification parameters' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: 'Razorpay key secret is not configured' },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Constant-time HMAC comparison using crypto.timingSafeEqual to prevent side-channel timing attacks
    const genSigBuf = Buffer.from(generatedSignature, 'utf-8');
    const recSigBuf = Buffer.from(String(razorpay_signature), 'utf-8');
    const isSignatureValid = genSigBuf.length === recSigBuf.length && crypto.timingSafeEqual(genSigBuf, recSigBuf);

    if (isSignatureValid) {
      const normalizedEmail = email ? email.toLowerCase().trim() : '';
      const finalAmount = Number(amount) || 99;

      // Check if payment has already been marked as used in Firestore or local fallback
      let isAlreadyUsed = false;
      try {
        const db = getFirestoreDB();
        const payDoc = await db.collection('verified_payments').doc(razorpay_payment_id).get();
        if (payDoc.exists && payDoc.data()?.used) {
          isAlreadyUsed = true;
        }
      } catch (e) {
        console.warn('[Verify Payment] Firestore read failed, checking fallback:', e);
      }

      if (!isAlreadyUsed) {
        try {
          const payments = readPaymentsFallback();
          const existing = payments.find(p => p.paymentId === razorpay_payment_id);
          if (existing && existing.used) {
            isAlreadyUsed = true;
          }
        } catch (e) {
          console.warn('[Verify Payment] Fallback read failed:', e);
        }
      }

      if (isAlreadyUsed) {
        console.log(`[Verify Payment] Payment ${razorpay_payment_id} has already been used! Blocking reuse.`);
        return NextResponse.json(
          { error: 'This payment has already been used.' },
          { status: 400 }
        );
      }

      let savedToFirestore = false;

      // Persist to Firestore
      try {
        console.log(`[Firestore] Logging verified payment ${razorpay_payment_id} for email: ${normalizedEmail}`);
        const db = getFirestoreDB();
        await db.collection('verified_payments').doc(razorpay_payment_id).set({
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          email: normalizedEmail,
          amount: finalAmount,
          status: 'SUCCESS',
          used: false,
          usedByStoryId: '',
          createdAt: new Date(),
        });
        savedToFirestore = true;
        console.log(`[Firestore] Successfully stored verified payment ${razorpay_payment_id}`);
      } catch (firestoreErr: any) {
        console.error('[Firestore Errors] Failed to store payment in Firestore:', firestoreErr);
      }

      // Fallback local JSON file persistence
      try {
        const payments = readPaymentsFallback();
        const existingIdx = payments.findIndex(p => p.paymentId === razorpay_payment_id);
        const paymentObj = {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          email: normalizedEmail,
          amount: finalAmount,
          status: 'SUCCESS',
          used: false,
          usedByStoryId: '',
          createdAt: new Date().toISOString(),
        };

        if (existingIdx !== -1) {
          payments[existingIdx] = paymentObj;
        } else {
          payments.push(paymentObj);
        }
        writePaymentsFallback(payments);
      } catch (fallbackErr: any) {
        console.error('Failed to write to local payments fallback:', fallbackErr);
      }

      return NextResponse.json({ success: true, message: 'Payment verified successfully' });
    } else {
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify Razorpay payment' },
      { status: 500 }
    );
  }
}

// sync
