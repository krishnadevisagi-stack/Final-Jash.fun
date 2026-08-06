import fs from 'fs';
import path from 'path';

const FALLBACK_PAYMENTS_PATH = path.join(process.cwd(), 'payments_fallback.json');
const FALLBACK_LEADERBOARD_PATH = path.join(process.cwd(), 'leaderboard_fallback.json');

export interface PaymentFallbackRecord {
  paymentId: string;
  orderId: string;
  email: string;
  amount: number;
  status: string;
  used: boolean;
  usedByStoryId?: string;
  createdAt: string;
}

export interface LeaderboardFallbackRecord {
  _id: string;
  name: string;
  amount: number;
  isPublic: boolean;
  email?: string;
  storyId?: string;
  celebrationData?: any;
  createdAt: string;
  expiresAt?: string;
}

export function readPaymentsFallback(): PaymentFallbackRecord[] {
  try {
    if (fs.existsSync(FALLBACK_PAYMENTS_PATH)) {
      const data = fs.readFileSync(FALLBACK_PAYMENTS_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading payments fallback file:', e);
  }
  return [];
}

export function writePaymentsFallback(data: PaymentFallbackRecord[]): void {
  try {
    fs.writeFileSync(FALLBACK_PAYMENTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing payments fallback file:', e);
  }
}

export function readLeaderboardFallback(): LeaderboardFallbackRecord[] {
  try {
    if (fs.existsSync(FALLBACK_LEADERBOARD_PATH)) {
      const data = fs.readFileSync(FALLBACK_LEADERBOARD_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading leaderboard fallback file:', e);
  }
  return [];
}

export function writeLeaderboardFallback(data: LeaderboardFallbackRecord[]): void {
  try {
    fs.writeFileSync(FALLBACK_LEADERBOARD_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing leaderboard fallback file:', e);
  }
}
