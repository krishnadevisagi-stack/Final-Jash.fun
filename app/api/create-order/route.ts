import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

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

import { enforceMaxBodySize } from '../../../lib/body-guard';
import { isValidNumber, isValidString } from '../../../lib/input-validator';

export async function POST(req: NextRequest) {
  try {
    const sizeErr = enforceMaxBodySize(req, 64 * 1024); // 64KB max size limit
    if (sizeErr) return sizeErr;

    const body = await req.json();
    const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}` } = body;

    if (!isValidNumber(amount, 100)) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (1 INR)' },
        { status: 400 }
      );
    }

    if (!isValidString(currency, 10) || !isValidString(receipt, 128)) {
      return NextResponse.json(
        { error: 'Invalid currency or receipt format' },
        { status: 400 }
      );
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create Razorpay order' },
      { status: 500 }
    );
  }
}

// sync
