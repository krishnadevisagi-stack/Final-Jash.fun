import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import { getFirestoreDB } from '../../../lib/firestore';

export const dynamic = 'force-dynamic';

let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials are not configured in environment variables');
    }
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

import { readPaymentsFallback, writePaymentsFallback } from '../../../lib/fallback-storage';
import { isValidEmail, isValidId } from '../../../lib/input-validator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, email, amount } = body;

    if (!isValidId(orderId, 128) || !isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Valid orderId is required' }, { status: 400 });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const finalAmount = Number(amount) || 99;

    console.log(`[Check Order Status] Checking Razorpay order: ${orderId} for email: ${normalizedEmail}`);

    const razorpay = getRazorpay();
    const order = await razorpay.orders.fetch(orderId);

    if (order.status === 'paid') {
      const paymentsResponse = await razorpay.orders.fetchPayments(orderId);
      const items = (paymentsResponse as any).items || [];
      const successfulPayment = items.find((p: any) => p.status === 'captured' || p.status === 'authorized');

      if (successfulPayment) {
        const paymentId = successfulPayment.id;
        console.log(`[Check Order Status] Order ${orderId} is paid! Found payment ID: ${paymentId}`);

        // Check if payment has already been marked as used in Firestore or local fallback
        let isAlreadyUsed = false;
        try {
          const db = getFirestoreDB();
          const payDoc = await db.collection('verified_payments').doc(paymentId).get();
          if (payDoc.exists && payDoc.data()?.used) {
            isAlreadyUsed = true;
          }
        } catch (e) {
          console.warn('[Check Order Status] Firestore read failed, checking fallback:', e);
        }

        if (!isAlreadyUsed) {
          try {
            const payments = readPaymentsFallback();
            const existing = payments.find(p => p.paymentId === paymentId);
            if (existing && existing.used) {
              isAlreadyUsed = true;
            }
          } catch (e) {
            console.warn('[Check Order Status] Fallback read failed:', e);
          }
        }

        if (isAlreadyUsed) {
          console.log(`[Check Order Status] Payment ${paymentId} has already been used! Blocking reuse.`);
          return NextResponse.json({
            success: true,
            verified: false,
            error: 'This payment has already been used.',
          });
        }

        // Persist verified payment in Firestore
        try {
          const db = getFirestoreDB();
          await db.collection('verified_payments').doc(paymentId).set({
            paymentId: paymentId,
            orderId: orderId,
            email: normalizedEmail,
            amount: finalAmount,
            status: 'SUCCESS',
            used: false,
            usedByStoryId: '',
            createdAt: new Date(),
          });
          console.log(`[Check Order Status] Stored verified payment ${paymentId} in Firestore`);
        } catch (firestoreErr: any) {
          console.error('[Check Order Status] Firestore storage failed:', firestoreErr);
        }

        // Persist verified payment in local fallback
        try {
          const payments = readPaymentsFallback();
          const existingIdx = payments.findIndex(p => p.paymentId === paymentId);
          const paymentObj = {
            paymentId: paymentId,
            orderId: orderId,
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
          console.log(`[Check Order Status] Stored verified payment ${paymentId} in local fallback`);
        } catch (fallbackErr: any) {
          console.error('[Check Order Status] Fallback storage failed:', fallbackErr);
        }

        return NextResponse.json({
          success: true,
          verified: true,
          paymentId: paymentId,
          orderId: orderId,
          amount: finalAmount,
        });
      }
    }

    return NextResponse.json({
      success: true,
      verified: false,
      status: order.status,
    });
  } catch (error: any) {
    console.error('Error in POST /api/check-order-status:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// sync
