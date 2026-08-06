import { NextRequest, NextResponse } from 'next/server';
import { uploadToGCS } from '../../../lib/gcs';

import { checkRateLimit, getEnvLimit } from '../../../lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const limit = getEnvLimit('RATE_LIMIT_UPLOADS', 20);
    const { isRateLimited } = checkRateLimit(req, limit, 60 * 1000);
    if (isRateLimited) {
      return NextResponse.json({ success: false, error: 'Too many upload requests' }, { status: 429 });
    }
    const contentType = req.headers.get('content-type') || '';
    let storyId = '';
    let mediaType = ''; // e.g. 'hero', 'secret', 'creator', 'music', 'photo_0', 'gallery_0'
    let email = '';
    let buffer: Buffer;
    let mimeType = 'image/jpeg';

    let requestMode = 'story';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      storyId = (formData.get('storyId') as string) || '';
      mediaType = (formData.get('mediaType') as string) || '';
      email = (formData.get('email') as string) || '';
      requestMode = (formData.get('mode') as string) || 'story';

      if (!file || !storyId || !mediaType) {
        return NextResponse.json({ success: false, error: 'Missing file, storyId, or mediaType' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      mimeType = file.type || 'image/jpeg';
    } else {
      const body = await req.json();
      storyId = body.storyId;
      mediaType = body.mediaType;
      email = body.email || '';
      requestMode = body.mode || 'story';
      const dataUri = body.dataUri || body.file;

      if (!dataUri || !storyId || !mediaType) {
        return NextResponse.json({ success: false, error: 'Missing dataUri, storyId, or mediaType' }, { status: 400 });
      }

      const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(dataUri, 'base64');
      }
    }

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB max file size limit
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File size exceeds maximum allowed limit (15MB)' }, { status: 400 });
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (mimeType && !allowedMimes.includes(mimeType.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only standard image and audio files are allowed.' }, { status: 400 });
    }

    // Server-side magic-byte signature validation (prevents MIME spoofing)
    const isHeaderValid = ((): boolean => {
      if (!buffer || buffer.length < 4) return false;
      const lowerMime = mimeType.toLowerCase();
      if (lowerMime.includes('jpeg') || lowerMime.includes('jpg')) {
        return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      }
      if (lowerMime.includes('png')) {
        return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      }
      if (lowerMime.includes('webp')) {
        return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
      }
      if (lowerMime.includes('gif')) {
        return buffer.toString('ascii', 0, 3) === 'GIF';
      }
      if (lowerMime.includes('audio') || lowerMime.includes('mp3') || lowerMime.includes('wav') || lowerMime.includes('ogg') || lowerMime.includes('m4a')) {
        const header = buffer.toString('ascii', 0, 12);
        return header.startsWith('ID3') || header.startsWith('RIFF') || header.startsWith('OggS') || header.includes('ftyp') || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0);
      }
      return true;
    })();

    if (!isHeaderValid) {
      return NextResponse.json({ success: false, error: 'File content signature does not match declared file type' }, { status: 400 });
    }

    // Strip EXIF metadata (GPS/location tags) from JPEG uploads for user privacy protection
    if (mimeType.toLowerCase().includes('jpeg') || mimeType.toLowerCase().includes('jpg')) {
      try {
        let offset = 2;
        while (offset < buffer.length - 4) {
          if (buffer[offset] !== 0xFF) break;
          const marker = buffer[offset + 1];
          if (marker === 0xD9 || marker === 0xDA) break;
          const segmentLength = buffer.readUInt16BE(offset + 2);
          if (marker === 0xE1) { // APP1 EXIF segment
            buffer = Buffer.concat([buffer.subarray(0, offset), buffer.subarray(offset + 2 + segmentLength)]);
            offset = 2; // re-scan
            continue;
          }
          offset += 2 + segmentLength;
        }
      } catch (_) {}
    }

    // Sanitize parameters
    const safeStoryId = storyId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeKey = mediaType.replace(/[^a-zA-Z0-9_-]/g, '');
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const sanitizedEmail = normalizedEmail ? normalizedEmail.replace(/[^a-zA-Z0-9_.-]/g, '_') : '';
    const userId = sanitizedEmail || 'guest';

    const isLanding = requestMode === 'landing' || requestMode === 'premium';
    const modeFolder = isLanding ? 'premium-landing-page' : 'story-mode';

    const gcsPath = `${modeFolder}/${userId}/${safeStoryId}/${safeKey}`;
    console.log(`[Upload Media API] Uploading ${mediaType} for ${modeFolder}: ${safeStoryId} to path: ${gcsPath}`);

    const uploadSuccess = await uploadToGCS(gcsPath, buffer, mimeType);

    if (!uploadSuccess) {
      console.warn(`[Upload Media API] GCS upload notice for ${gcsPath}, local fallback active.`);
    }

    const emailParam = normalizedEmail ? `&email=${encodeURIComponent(normalizedEmail)}` : '';
    const assetUrl = `/api/assets?storyId=${safeStoryId}&key=${safeKey}&mode=${isLanding ? 'landing' : 'story'}${emailParam}`;

    return NextResponse.json({
      success: true,
      url: assetUrl,
      storyId: safeStoryId,
      mediaType: safeKey,
      gcsPath
    });
  } catch (err: any) {
    console.error('[Upload Media API Error]', err);
    return NextResponse.json({ success: false, error: 'Failed to upload media' }, { status: 500 });
  }
}
