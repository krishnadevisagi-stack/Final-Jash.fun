import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { deleteStoryAssetsFromGCS } from '../../../../lib/gcs';
import { getFirestoreDB } from '../../../../lib/firestore';

export const dynamic = 'force-dynamic';

import { readLeaderboardFallback as readFallback, writeLeaderboardFallback as writeFallback } from '../../../../lib/fallback-storage';

export async function GET(req: NextRequest) {
  return handleCleanup(req);
}

export async function POST(req: NextRequest) {
  return handleCleanup(req);
}

async function handleCleanup(req: NextRequest) {
  try {
    // Optional basic authentication check for production
    const { searchParams } = new URL(req.url);
    const clientSecret = searchParams.get('secret') || req.headers.get('x-cron-secret');
    const configuredSecret = process.env.CRON_SECRET;

    if (!configuredSecret || clientSecret !== configuredSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const deletedStoryIds: string[] = [];
    let deletedCount = 0;

    // 1. Run Firestore Cleanups (Primary Database)
    try {
      console.log('[Firestore] Running cron scheduler cleanup check...');
      const db = getFirestoreDB();
      
      // A. Premium Users Cleanup
      const expiredSnapshot = await db.collection('premium_users')
        .where('expiresAt', '<', now)
        .get();

      for (const doc of expiredSnapshot.docs) {
        const data = doc.data();
        const storyId = doc.id;
        deletedStoryIds.push(storyId);
        deletedCount++;

        // Delete GCS Assets
        try {
          console.log(`[Cloud Storage] Deleting expired GCS assets for premium storyId: ${storyId}`);
          await deleteStoryAssetsFromGCS(storyId, data.email);
        } catch (gcsErr: any) {
          console.error(`[Cloud Storage Errors] Failed to clean GCS assets for story ${storyId}:`, gcsErr);
        }

        // Delete from Firestore
        console.log(`[Firestore] Deleting expired premium page document for storyId: ${storyId}`);
        await doc.ref.delete();
      }

      // B. Free Stories Cleanup (strictly 1 year after creation)
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const freeStoriesSnapshot = await db.collection('free_stories').get();

      for (const doc of freeStoriesSnapshot.docs) {
        const data = doc.data();
        const storyId = doc.id;
        const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
        const expiresAt = data.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)) : null;

        const isExpired = (expiresAt && expiresAt < now) || (createdAt && createdAt < oneYearAgo);

        if (isExpired) {
          deletedStoryIds.push(storyId);
          deletedCount++;

          // Delete GCS Assets
          try {
            console.log(`[Cloud Storage] Deleting expired GCS assets for free storyId: ${storyId}`);
            await deleteStoryAssetsFromGCS(storyId, data.email);
          } catch (gcsErr: any) {
            console.error(`[Cloud Storage Errors] Failed to clean GCS assets for free story ${storyId}:`, gcsErr);
          }

          // Delete comments subcollection if exists
          try {
            const commentsSnap = await db.collection(`free_stories/${storyId}/comments`).get();
            for (const commentDoc of commentsSnap.docs) {
              await commentDoc.ref.delete();
            }
          } catch (cErr) {
            console.warn(`[Firestore] Error deleting comments for story ${storyId}:`, cErr);
          }

          // Delete document from Firestore
          console.log(`[Firestore] Deleting expired free story document for storyId: ${storyId}`);
          await doc.ref.delete();
        }
      }
    } catch (firestoreErr: any) {
      console.error('[Scheduler Errors] Failed to execute cleanup scheduler in Firestore:', firestoreErr);
    }

    // 2. Local Fallback cleanups if files are present
    try {
      const allUsers = readFallback();
      const expiredUsers = allUsers.filter(u => u.expiresAt && new Date(u.expiresAt) < now);
      const activeUsers = allUsers.filter(u => !u.expiresAt || new Date(u.expiresAt) >= now);

      for (const user of expiredUsers) {
        if (user.storyId && !deletedStoryIds.includes(user.storyId)) {
          deletedStoryIds.push(user.storyId);
          deletedCount++;
          try {
            await deleteStoryAssetsFromGCS(user.storyId, user.email);
          } catch (gcsErr: any) {
            console.error(`[Cloud Storage Errors] Failed to clean GCS assets for local story ${user.storyId}:`, gcsErr);
          }
        }
      }

      writeFallback(activeUsers);
    } catch (fallbackErr: any) {
      console.error('[Scheduler Errors] Failed to execute cleanup scheduler on local fallback storage:', fallbackErr);
    }

    console.log(`[Cron Cleanup] Successfully completed scheduler run. Removed ${deletedCount} expired pages. StoryIds:`, deletedStoryIds);

    return NextResponse.json({
      success: true,
      message: 'Cleanup process completed successfully.',
      deletedCount,
      deletedStoryIds,
      timestamp: now.toISOString()
    });
  } catch (error: any) {
    console.error('[Scheduler Errors] Error during background cleanup cron:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error during cleanup'
    }, { status: 500 });
  }
}

// sync
