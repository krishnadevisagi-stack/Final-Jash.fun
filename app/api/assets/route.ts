import { NextRequest, NextResponse } from 'next/server';
import { downloadFromGCS } from '../../../lib/gcs';
import { getFirestoreDB } from '../../../lib/firestore';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// In-memory RAM asset cache for sub-millisecond (0ms) asset responses
const RAM_ASSET_CACHE = new Map<string, { buffer: Buffer; mimeType: string }>();

function resolvePathFromMediaRefs(mediaRefs: any, key: string): string | null {
  if (!mediaRefs || typeof mediaRefs !== 'object') return null;
  if (key === 'hero') return mediaRefs.heroImage || mediaRefs.hero || null;
  if (key === 'secret') return mediaRefs.secretImage || mediaRefs.secret || null;
  if (key === 'creator') return mediaRefs.creatorPhoto || mediaRefs.creator || null;
  if (key === 'music') return mediaRefs.music || null;
  if (key.startsWith('gallery_')) {
    const idx = parseInt(key.replace('gallery_', ''), 10);
    if (Array.isArray(mediaRefs.galleryPhotos) && mediaRefs.galleryPhotos[idx]) {
      return mediaRefs.galleryPhotos[idx];
    }
    if (Array.isArray(mediaRefs.photos) && mediaRefs.photos[idx]) {
      return mediaRefs.photos[idx];
    }
    if (mediaRefs.heroImage) return mediaRefs.heroImage;
  }
  if (key.startsWith('photo_')) {
    const idx = parseInt(key.replace('photo_', ''), 10);
    if (Array.isArray(mediaRefs.photos) && mediaRefs.photos[idx]) {
      return mediaRefs.photos[idx];
    }
    if (Array.isArray(mediaRefs.galleryPhotos) && mediaRefs.galleryPhotos[idx]) {
      return mediaRefs.galleryPhotos[idx];
    }
    if (mediaRefs.heroImage) return mediaRefs.heroImage;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const storyId = url.searchParams.get('storyId');
    const key = url.searchParams.get('key');
    const email = url.searchParams.get('email');

    if (!storyId || !key) {
      return NextResponse.json({ error: 'Missing storyId or key parameter' }, { status: 400 });
    }

    const mode = url.searchParams.get('mode');

    // Sanitize parameters to avoid path traversal
    const safeStoryId = storyId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '');

    const cacheKey = `${safeStoryId}_${safeKey}_${mode || ''}_${email || ''}`;

    // 0. Check in-memory RAM cache for 0ms response
    if (RAM_ASSET_CACHE.has(cacheKey)) {
      const cached = RAM_ASSET_CACHE.get(cacheKey)!;
      return new Response(new Uint8Array(cached.buffer), {
        headers: {
          'Content-Type': cached.mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    let asset = null;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const sanitizedEmail = normalizedEmail ? normalizedEmail.replace(/[^a-zA-Z0-9_.-]/g, '_') : '';
    const userId = sanitizedEmail || 'guest';
    const folderName = sanitizedEmail ? `${sanitizedEmail}_${safeStoryId}` : safeStoryId;

    // 1. Check Firestore mediaReferences first for guaranteed 1-shot GCS path resolution
    try {
      const db = getFirestoreDB();
      let gcsPath: string | null = null;

      if (mode === 'story' || !mode) {
        const freeDoc = await db.collection('free_stories').doc(safeStoryId).get();
        if (freeDoc.exists) {
          const storyData = freeDoc.data() || {};
          const mediaRefs = storyData.mediaReferences || storyData.storageReferences || {};
          gcsPath = resolvePathFromMediaRefs(mediaRefs, safeKey);
        }
      }

      if (!gcsPath && (mode === 'landing' || mode === 'premium' || !mode)) {
        const premDoc = await db.collection('premium_users').doc(safeStoryId).get();
        if (premDoc.exists) {
          const premData = premDoc.data() || {};
          const mediaRefs = premData.mediaReferences || premData.storageReferences || {};
          gcsPath = resolvePathFromMediaRefs(mediaRefs, safeKey);
        }
      }

      if (gcsPath) {
        asset = await downloadFromGCS(gcsPath);
      }
    } catch (dbErr) {
      console.warn('[Assets API] Firestore initial lookup skipped:', dbErr);
    }

    // 2. Direct Cloud Storage folder paths if Firestore mediaReferences missed
    if (!asset) {
      if (mode === 'story') {
        asset = await downloadFromGCS(`story-mode/${userId}/${safeStoryId}/${safeKey}`);
        if (!asset && safeKey.startsWith('photo_')) {
          const altKey = safeKey.replace('photo_', 'gallery_');
          asset = await downloadFromGCS(`story-mode/${userId}/${safeStoryId}/${altKey}`);
        }
        if (!asset && safeKey.startsWith('gallery_')) {
          const altKey = safeKey.replace('gallery_', 'photo_');
          asset = await downloadFromGCS(`story-mode/${userId}/${safeStoryId}/${altKey}`);
        }
        if (!asset && userId !== 'guest') {
          asset = await downloadFromGCS(`story-mode/guest/${safeStoryId}/${safeKey}`);
        }
        if (!asset) {
          asset = await downloadFromGCS(`story_mode/${folderName}/${safeKey}`);
        }
        if (!asset && sanitizedEmail) {
          asset = await downloadFromGCS(`story_mode/${safeStoryId}/${safeKey}`);
        }
      } else if (mode === 'landing' || mode === 'premium') {
        asset = await downloadFromGCS(`premium-landing-page/${userId}/${safeStoryId}/${safeKey}`);
        if (!asset && userId !== 'guest') {
          asset = await downloadFromGCS(`premium-landing-page/guest/${safeStoryId}/${safeKey}`);
        }
        if (!asset) {
          asset = await downloadFromGCS(`landing_pages/${folderName}/${safeKey}`);
        }
        if (!asset && sanitizedEmail) {
          asset = await downloadFromGCS(`landing_pages/${safeStoryId}/${safeKey}`);
        }
      }
    }

    // Unspecified mode check: check story-mode/ and premium-landing-page/, then legacy story_mode/ and landing_pages/
    if (!asset && !mode) {
      asset = await downloadFromGCS(`story-mode/${userId}/${safeStoryId}/${safeKey}`) ||
              await downloadFromGCS(`premium-landing-page/${userId}/${safeStoryId}/${safeKey}`) ||
              await downloadFromGCS(`story-mode/guest/${safeStoryId}/${safeKey}`) ||
              await downloadFromGCS(`premium-landing-page/guest/${safeStoryId}/${safeKey}`);
      if (!asset && sanitizedEmail) {
        asset = await downloadFromGCS(`story_mode/${folderName}/${safeKey}`) ||
                await downloadFromGCS(`landing_pages/${folderName}/${safeKey}`);
      }
      if (!asset) {
        asset = await downloadFromGCS(`story_mode/${safeStoryId}/${safeKey}`) ||
                await downloadFromGCS(`landing_pages/${safeStoryId}/${safeKey}`);
      }
    }

    // 3. Fallback: resolve email from free_stories or premium_users and download from category folders
    if (!asset && !email) {
      try {
        const db = getFirestoreDB();
        let resolvedEmail: string | null = null;

        const freeDoc = await db.collection('free_stories').doc(safeStoryId).get();
        if (freeDoc.exists) {
          const d = freeDoc.data();
          resolvedEmail = d?.email || d?.celebrationData?.email || null;
        }

        if (!resolvedEmail) {
          const premDoc = await db.collection('premium_users').doc(safeStoryId).get();
          if (premDoc.exists) {
            const d = premDoc.data();
            resolvedEmail = d?.email || d?.celebrationData?.premiumEmail || null;
          }
        }

        if (resolvedEmail) {
          const sanitizedEmail = resolvedEmail.toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
          const resolvedFolderName = `${sanitizedEmail}_${safeStoryId}`;
          asset = await downloadFromGCS(`story_mode/${resolvedFolderName}/${safeKey}`) ||
                  await downloadFromGCS(`landing_pages/${resolvedFolderName}/${safeKey}`) ||
                  await downloadFromGCS(`celebrations/${resolvedFolderName}/${safeKey}`);
        }
      } catch (dbErr) {
        console.warn('[Assets API] Failed email resolution:', dbErr);
      }
    }

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Cache in RAM for future 0ms requests (up to 100 assets)
    if (RAM_ASSET_CACHE.size > 100) {
      const firstKey = RAM_ASSET_CACHE.keys().next().value;
      if (firstKey) RAM_ASSET_CACHE.delete(firstKey);
    }
    RAM_ASSET_CACHE.set(cacheKey, asset);

    return new Response(new Uint8Array(asset.buffer), {
      headers: {
        'Content-Type': asset.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error serving asset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// sync
