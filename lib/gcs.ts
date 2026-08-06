import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

let storage: Storage | null = null;
let initializedWithCustom = false;

export function getGCSBucketName(): string | null {
  let envBucket = process.env.GCS_BUCKET_NAME;
  if (envBucket) {
    envBucket = envBucket.trim().replace(/^["']|["']$/g, '');
  }
  if (envBucket && envBucket !== '' && !envBucket.includes('...')) {
    return envBucket;
  }

  // Fallback to reading firebase-applet-config.json
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.storageBucket) {
        let bucket = config.storageBucket.trim().replace(/^["']|["']$/g, '');
        console.log('[GCS Fallback] Using storageBucket from firebase-applet-config.json:', bucket);
        return bucket;
      }
    }
  } catch (err) {
    console.warn('[GCS Fallback] Could not read firebase-applet-config.json:', err);
  }

  return null;
}

export function hasCustomGCSCredentials(): boolean {
  const clientEmail = process.env.GCS_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '');
  let privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (privateKey) {
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
  }
  return !!(clientEmail && privateKey);
}

export function getGCSStorage(): Storage | null {
  const bucketName = getGCSBucketName();
  if (!bucketName) {
    return null;
  }

  const projectId = process.env.GCS_PROJECT_ID?.trim().replace(/^["']|["']$/g, '');
  const clientEmail = process.env.GCS_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '');
  let privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (privateKey) {
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
  }
  const hasCustom = !!(clientEmail && privateKey);

  if (!hasCustom) {
    return null;
  }

  if (!storage || !initializedWithCustom) {
    console.log('[GCS] Initializing Storage with custom credentials. clientEmail length:', clientEmail!.length);
    storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });
    initializedWithCustom = true;
  }
  return storage;
}

export function parseBase64DataUri(dataUri: string): { mimeType: string; buffer: Buffer } | null {
  if (!dataUri.startsWith('data:')) return null;
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  return { mimeType, buffer };
}

export async function uploadToGCS(pathStr: string, base64OrBuffer: string | Buffer, mimeType?: string): Promise<boolean> {
  let buffer: Buffer;
  let finalMimeType = mimeType || 'application/octet-stream';

  if (typeof base64OrBuffer === 'string') {
    const parsed = parseBase64DataUri(base64OrBuffer);
    if (parsed) {
      buffer = parsed.buffer;
      finalMimeType = parsed.mimeType;
    } else {
      buffer = Buffer.from(base64OrBuffer, 'base64');
    }
  } else {
    buffer = base64OrBuffer;
  }

  // Always write locally as a fallback
  try {
    const localPath = path.join(process.cwd(), '.local-gcs-fallback', pathStr);
    const localDir = path.dirname(localPath);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.writeFileSync(localPath, buffer);
    console.log(`[Local Fallback] Asset saved successfully at local path: ${localPath}`);
  } catch (localErr) {
    console.warn('[Local Fallback] Failed to save asset locally:', localErr);
  }

  const bucketName = getGCSBucketName();
  if (!bucketName) {
    console.log('[Asset Storage] GCS Bucket name not configured. Asset saved instantly to local fallback storage.');
    return true;
  }

  const storageClient = getGCSStorage();
  if (!storageClient) {
    console.log('[Asset Storage] Custom GCS credentials not configured. Asset saved instantly to local fallback storage.');
    return true;
  }

  try {
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(pathStr);

    const savePromise = file.save(buffer, {
      metadata: {
        contentType: finalMimeType,
      },
      resumable: false,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`GCS upload timed out after 3s for path ${pathStr}`)), 3000)
    );

    await Promise.race([savePromise, timeoutPromise]);

    console.log(`[GCS] Successfully uploaded asset to GCS path: ${pathStr}`);
    return true;
  } catch (error: any) {
    console.warn(`[GCS Upload Notice] GCS save skipped (${error?.message || error}). Local storage fallback active for: ${pathStr}`);
    return true;
  }
}

export async function downloadFromGCS(pathStr: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  // 1. First check local fallback (instant disk access, 0ms latency)
  try {
    const localPath = path.join(process.cwd(), '.local-gcs-fallback', pathStr);
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      let mimeType = 'application/octet-stream';
      if (pathStr.endsWith('hero') || pathStr.endsWith('secret') || pathStr.endsWith('creator') || pathStr.includes('gallery_') || pathStr.includes('photo_')) {
        mimeType = 'image/jpeg';
      } else if (pathStr.endsWith('music') || pathStr.includes('music') || pathStr.endsWith('.mp3') || pathStr.endsWith('.wav') || pathStr.endsWith('.m4a')) {
        mimeType = 'audio/mpeg';
      } else if (pathStr.endsWith('.txt')) {
        mimeType = 'text/plain';
      }
      console.log(`[Local Fallback] Retrieved asset instantly from local path: ${localPath}`);
      return { buffer, mimeType };
    }
  } catch (err) {
    console.log(`[Asset Storage] Local fallback read error:`, err);
  }

  // 2. Try GCS with timeout if configured
  const bucketName = getGCSBucketName();
  const storageClient = getGCSStorage();

  if (bucketName && storageClient) {
    try {
      const bucket = storageClient.bucket(bucketName);
      const file = bucket.file(pathStr);

      const downloadTask = (async () => {
        const [exists] = await file.exists();
        if (exists) {
          const [metadata] = await file.getMetadata();
          const mimeType = metadata.contentType || 'application/octet-stream';
          const [buffer] = await file.download();
          return { buffer, mimeType };
        }
        return null;
      })();

      const timeoutTask = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error(`GCS download timed out for ${pathStr}`)), 5000)
      );

      const res = await Promise.race([downloadTask, timeoutTask]);
      if (res) {
        console.log(`[GCS] Downloaded asset from GCS path: ${pathStr}`);
        return res;
      }
    } catch (error: any) {
      console.error(`[GCS Error/Timeout] Download failed for path ${pathStr}:`, error?.message || error);
    }
  }

  return null;
}

export async function deleteStoryAssetsFromGCS(storyId: string, email?: string): Promise<boolean> {
  const sanitizedEmail = email ? email.toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_') : '';
  const folderName = sanitizedEmail ? `${sanitizedEmail}_${storyId}` : storyId;

  // 1. Delete local fallback assets for both possible paths
  const localDirs = [
    path.join(process.cwd(), '.local-gcs-fallback', 'celebrations', folderName),
    path.join(process.cwd(), '.local-gcs-fallback', 'celebrations', storyId)
  ];
  for (const localDir of localDirs) {
    try {
      if (fs.existsSync(localDir)) {
        fs.rmSync(localDir, { recursive: true, force: true });
        console.log(`[Local Fallback] Deleted local assets for story directory: ${localDir}`);
      }
    } catch (err) {
      console.warn('[Local Fallback] Failed to delete local assets:', err);
    }
  }

  // 2. Delete from GCS if configured
  const bucketName = getGCSBucketName();
  if (!bucketName) return true;

  const storageClient = getGCSStorage();
  if (!storageClient) return true;

  try {
    const bucket = storageClient.bucket(bucketName);
    
    // Attempt deleting folder with email prefix, and folder with just storyId
    const prefixes = [`celebrations/${folderName}/`];
    if (folderName !== storyId) {
      prefixes.push(`celebrations/${storyId}/`);
    }

    for (const prefix of prefixes) {
      const [files] = await bucket.getFiles({ prefix });
      if (files.length > 0) {
        await Promise.all(files.map(file => file.delete()));
        console.log(`[GCS] Deleted GCS assets for story prefix: ${prefix}`);
      }
    }
    return true;
  } catch (error) {
    console.log(`[Asset Storage] Local fallback assets cleaned up for story: ${storyId}`);
    return true; 
  }
}

// sync
