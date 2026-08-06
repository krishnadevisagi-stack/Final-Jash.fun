import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreDB } from '../../../lib/firestore';
import { sendFreeEmailViaGmailAPI } from '../../../lib/gmail';
import { uploadToGCS } from '../../../lib/gcs';

export const dynamic = 'force-dynamic';

async function processAndUploadFreeAssets(storyId: string, celebrationData: any, existingMediaRefs: any, email?: string) {
  if (!celebrationData) return { processed: celebrationData, mediaRefs: {} };

  const cloned = { ...celebrationData };
  const isBase64 = (str: any) => typeof str === 'string' && str.startsWith('data:');

  const normalizedEmail = (email || cloned.email || cloned.premiumEmail || '').toLowerCase().trim();
  const sanitizedEmail = normalizedEmail ? normalizedEmail.replace(/[^a-zA-Z0-9_.-]/g, '_') : '';
  const userId = sanitizedEmail || 'guest';
  const folderPath = `story-mode/${userId}/${storyId}`;
  const emailParam = normalizedEmail ? `&email=${encodeURIComponent(normalizedEmail)}` : '';
  const modeParam = '&mode=story';

  const mediaRefs: any = {
    heroImage: existingMediaRefs?.heroImage || existingMediaRefs?.hero || null,
    secretImage: existingMediaRefs?.secretImage || existingMediaRefs?.secret || null,
    creatorPhoto: existingMediaRefs?.creatorPhoto || existingMediaRefs?.creator || null,
    music: existingMediaRefs?.music || null,
    galleryPhotos: Array.isArray(existingMediaRefs?.galleryPhotos) ? [...existingMediaRefs.galleryPhotos] : [],
    photos: Array.isArray(existingMediaRefs?.photos) ? [...existingMediaRefs.photos] : [],
  };

  const uploadTasks: Promise<void>[] = [];

  // 1. Hero Image
  if (isBase64(cloned.heroImage)) {
    uploadTasks.push(
      (async () => {
        try {
          const gcsPath = `${folderPath}/hero`;
          console.log(`[Cloud Storage] Uploading hero image for story mode: ${storyId}, GCS Path: ${gcsPath}`);
          const success = await uploadToGCS(gcsPath, cloned.heroImage);
          if (success) {
            cloned.heroImage = `/api/assets?storyId=${storyId}&key=hero${modeParam}${emailParam}`;
            mediaRefs.heroImage = gcsPath;
          }
        } catch (e: any) {
          console.error('[Cloud Storage Errors] Error uploading heroImage to GCS:', e);
        }
      })()
    );
  }

  // 2. Secret Image
  if (isBase64(cloned.secretImage)) {
    uploadTasks.push(
      (async () => {
        try {
          const gcsPath = `${folderPath}/secret`;
          console.log(`[Cloud Storage] Uploading secret image for story mode: ${storyId}, GCS Path: ${gcsPath}`);
          const success = await uploadToGCS(gcsPath, cloned.secretImage);
          if (success) {
            cloned.secretImage = `/api/assets?storyId=${storyId}&key=secret${modeParam}${emailParam}`;
            mediaRefs.secretImage = gcsPath;
          }
        } catch (e: any) {
          console.error('[Cloud Storage Errors] Error uploading secretImage to GCS:', e);
        }
      })()
    );
  }

  // 3. Creator Photo
  if (isBase64(cloned.creatorPhoto)) {
    uploadTasks.push(
      (async () => {
        try {
          const gcsPath = `${folderPath}/creator`;
          console.log(`[Cloud Storage] Uploading creator photo for story mode: ${storyId}, GCS Path: ${gcsPath}`);
          const success = await uploadToGCS(gcsPath, cloned.creatorPhoto);
          if (success) {
            cloned.creatorPhoto = `/api/assets?storyId=${storyId}&key=creator${modeParam}${emailParam}`;
            mediaRefs.creatorPhoto = gcsPath;
          }
        } catch (e: any) {
          console.error('[Cloud Storage Errors] Error uploading creatorPhoto to GCS:', e);
        }
      })()
    );
  }

  // 4. Music
  if (isBase64(cloned.music)) {
    uploadTasks.push(
      (async () => {
        try {
          const gcsPath = `${folderPath}/music`;
          console.log(`[Cloud Storage] Uploading music for story mode: ${storyId}, GCS Path: ${gcsPath}`);
          const success = await uploadToGCS(gcsPath, cloned.music);
          if (success) {
            cloned.music = `/api/assets?storyId=${storyId}&key=music${modeParam}${emailParam}`;
            mediaRefs.music = gcsPath;
          }
        } catch (e: any) {
          console.error('[Cloud Storage Errors] Error uploading music to GCS:', e);
        }
      })()
    );
  }

  // 5. Gallery Photos
  if (Array.isArray(cloned.galleryPhotos)) {
    uploadTasks.push(
      (async () => {
        const updatedGalleryPaths: string[] = [];
        cloned.galleryPhotos = await Promise.all(
          cloned.galleryPhotos.map(async (photo: any, index: number) => {
            if (isBase64(photo)) {
              try {
                const key = `gallery_${index}`;
                const gcsPath = `${folderPath}/${key}`;
                console.log(`[Cloud Storage] Uploading gallery photo ${index} for story mode: ${storyId}, GCS Path: ${gcsPath}`);
                const success = await uploadToGCS(gcsPath, photo);
                if (success) {
                  updatedGalleryPaths[index] = gcsPath;
                  return `/api/assets?storyId=${storyId}&key=${key}${modeParam}${emailParam}`;
                }
              } catch (e: any) {
                console.error(`[Cloud Storage Errors] Error uploading gallery photo ${index} to GCS:`, e);
              }
              return photo;
            } else if (typeof photo === 'string' && photo.includes('/api/assets')) {
              updatedGalleryPaths[index] = mediaRefs.galleryPhotos?.[index] || '';
              return photo;
            }
            updatedGalleryPaths[index] = '';
            return photo;
          })
        );
        mediaRefs.galleryPhotos = updatedGalleryPaths;
      })()
    );
  }

  // 6. Photos (up to 5)
  if (!Array.isArray(cloned.photos) || cloned.photos.length === 0) {
    const defaultPhotos: string[] = [];
    if (cloned.heroImage) defaultPhotos.push(cloned.heroImage);
    if (Array.isArray(cloned.galleryPhotos)) defaultPhotos.push(...cloned.galleryPhotos);
    if (cloned.secretImage && !defaultPhotos.includes(cloned.secretImage)) defaultPhotos.push(cloned.secretImage);
    cloned.photos = defaultPhotos;
  }

  if (Array.isArray(cloned.photos)) {
    uploadTasks.push(
      (async () => {
        const updatedPhotosPaths: string[] = [];
        cloned.photos = await Promise.all(
          cloned.photos.map(async (photo: any, index: number) => {
            if (isBase64(photo)) {
              try {
                const key = `photo_${index}`;
                const gcsPath = `${folderPath}/${key}`;
                console.log(`[Cloud Storage] Uploading free photo ${index} for story mode: ${storyId}, GCS Path: ${gcsPath}`);
                const success = await uploadToGCS(gcsPath, photo);
                if (success) {
                  updatedPhotosPaths[index] = gcsPath;
                  return `/api/assets?storyId=${storyId}&key=${key}${modeParam}${emailParam}`;
                }
              } catch (e: any) {
                console.error(`[Cloud Storage Errors] Error uploading photo ${index} to GCS:`, e);
              }
              return photo;
            } else if (typeof photo === 'string' && photo.includes('/api/assets')) {
              updatedPhotosPaths[index] = mediaRefs.photos?.[index] || '';
              return photo;
            }
            updatedPhotosPaths[index] = '';
            return photo;
          })
        );
        mediaRefs.photos = updatedPhotosPaths;
      })()
    );
  }

  await Promise.all(uploadTasks);
  return { processed: cloned, mediaRefs };
}

function normalizeDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  // Check if it's a Firestore Timestamp (has toDate function)
  if (obj.toDate && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }
  // Alternate check for plain JSON representation of Timestamps
  if (typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
    return new Date(obj.seconds * 1000).toISOString();
  }
  // If it's a Date object
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // If it's an array
  if (Array.isArray(obj)) {
    return obj.map(normalizeDates);
  }

  // If it's a general object, recursively map its keys
  const res: any = {};
  for (const key of Object.keys(obj)) {
    res[key] = normalizeDates(obj[key]);
  }
  return res;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json({ success: false, error: 'storyId is required' }, { status: 400 });
    }

    const db = getFirestoreDB();
    const docRef = db.collection('free_stories').doc(storyId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      try {
        const premRef = db.collection('premium_users').doc(storyId);
        const premSnap = await premRef.get();
        if (premSnap.exists) {
          const storyData = normalizeDates(premSnap.data());
          return NextResponse.json({
            success: true,
            story: {
              storyId: storyData.storyId || storyId,
              email: storyData.email || storyData.celebrationData?.premiumEmail || '',
              celebrationData: storyData.celebrationData,
              comments: storyData.comments || [],
              createdAt: storyData.createdAt
            }
          });
        }
      } catch (premErr) {
        console.warn('Fallback lookup in premium_users failed:', premErr);
      }
      return NextResponse.json({ success: false, error: 'Story not found' }, { status: 404 });
    }

    const storyData = normalizeDates(docSnap.data());

    // Fetch comments belonging only to this story from the subcollection
    let comments: any[] = [];
    try {
      const commentsColRef = db.collection(`free_stories/${storyId}/comments`);
      const commentsSnap = await commentsColRef.get();
      if (commentsSnap && typeof commentsSnap.forEach === 'function') {
        commentsSnap.forEach((doc: any) => {
          comments.push(doc.data());
        });
      }
      comments.sort((a: any, b: any) => {
        return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
      });
    } catch (err) {
      console.error('[Free Story API GET] Error loading comments subcollection:', err);
    }

    storyData.comments = comments;

    return NextResponse.json({ success: true, story: storyData });
  } catch (err: any) {
    console.error('[Free Story API GET Error]', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storyId, email, celebrationData, comment } = body;

    if (!storyId) {
      return NextResponse.json({ success: false, error: 'storyId is required' }, { status: 400 });
    }

    if (storyId.startsWith('page-') || celebrationData?.mode === 'PREMIUM') {
      console.warn(`[Free Story API] Rejected page- prefix or premium mode storyId: ${storyId}`);
      return NextResponse.json({ success: false, error: 'Landing page mode stories must be saved via premium API, not free_stories' }, { status: 400 });
    }

    const db = getFirestoreDB();
    const docRef = db.collection('free_stories').doc(storyId);
    const docSnap = await docRef.get();

    // ── COMMENT APPEND SPECIAL CASE ──
    if (comment) {
      if (!comment.name || !comment.message) {
        return NextResponse.json({ success: false, error: 'Comment name and message are required' }, { status: 400 });
      }

      // Sanitize inputs
      const safeName = String(comment.name).trim().substring(0, 100) || 'Guest';
      const safeMessage = String(comment.message).trim().substring(0, 1000);
      if (!safeMessage) {
        return NextResponse.json({ success: false, error: 'Comment message cannot be empty' }, { status: 400 });
      }

      const commentId = comment.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
      const commentDocRef = db.collection(`free_stories/${storyId}/comments`).doc(commentId);

      const firestoreComment = {
        id: commentId,
        storyId,
        name: safeName,
        message: safeMessage,
        timestamp: comment.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        moderationFlags: []
      };

      await commentDocRef.set(firestoreComment);
      console.log(`[Comments API] Stored separate comment ${commentId} for story: ${storyId}`);

      // Fetch all comments to return (REST fallback)
      const commentsColRef = db.collection(`free_stories/${storyId}/comments`);
      const commentsSnap = await commentsColRef.get();
      const comments: any[] = [];
      if (commentsSnap && typeof commentsSnap.forEach === 'function') {
        commentsSnap.forEach((doc: any) => {
          comments.push(doc.data());
        });
      }

      // Sort comments by timestamp ascending
      comments.sort((a: any, b: any) => {
        return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
      });

      return NextResponse.json({
        success: true,
        message: 'Comment added successfully',
        comments: comments
      });
    }

    if (!celebrationData) {
      return NextResponse.json({ success: false, error: 'celebrationData is required when not posting a comment' }, { status: 400 });
    }

    const normalizedEmail = (email || celebrationData?.email || celebrationData?.premiumEmail || '').toLowerCase().trim();

    // If it already exists, prevent editing by another email to act as secure identifier lock
    if (docSnap.exists) {
      const existingData = normalizeDates(docSnap.data());
      const existingEmail = (existingData.email || existingData.celebrationData?.email || existingData.celebrationData?.premiumEmail || '').toLowerCase().trim();
      if (existingEmail && normalizedEmail && existingEmail !== normalizedEmail) {
        return NextResponse.json({
          success: false,
          error: 'Forbidden: Only the original creator can edit this story.'
        }, { status: 403 });
      }
    }

    const existingStory = docSnap.exists ? normalizeDates(docSnap.data()) : null;
    const existingMediaRefs = existingStory?.mediaReferences || existingStory?.storageReferences || {};

    const { processed: processedCelebrationData, mediaRefs } = await processAndUploadFreeAssets(storyId, celebrationData, existingMediaRefs, normalizedEmail);

    // Compute privacy & expiration (strictly 1 year from creation)
    const isPrivateChoice = body.freePrivacy === 'PRIVATE' || celebrationData?.freePrivacy === 'PRIVATE' || body.isPrivate === true || celebrationData?.isPrivate === true;
    const isPublic = !isPrivateChoice;
    const visibility = isPublic ? 'public' : 'private';

    const createdAtDate = existingStory && existingStory.createdAt ? new Date(existingStory.createdAt) : new Date();
    const expiresAtDate = new Date(createdAtDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    const savePayload = {
      storyId,
      email: normalizedEmail,
      storyType: 'FREE',
      status: 'active',
      isPublic,
      isPrivate: isPrivateChoice,
      freePrivacy: isPrivateChoice ? 'PRIVATE' : 'PUBLIC',
      visibility,
      createdAt: createdAtDate.toISOString(),
      expiresAt: expiresAtDate.toISOString(),
      updatedAt: new Date().toISOString(),
      mediaReferences: {
        heroImage: mediaRefs.heroImage || null,
        secretImage: mediaRefs.secretImage || null,
        creatorPhoto: mediaRefs.creatorPhoto || null,
        music: mediaRefs.music || null,
        galleryPhotos: mediaRefs.galleryPhotos || [],
        photos: mediaRefs.photos || [],
      },
      storageReferences: {
        heroImage: mediaRefs.heroImage || null,
        secretImage: mediaRefs.secretImage || null,
        creatorPhoto: mediaRefs.creatorPhoto || null,
        music: mediaRefs.music || null,
        galleryPhotos: mediaRefs.galleryPhotos || [],
        photos: mediaRefs.photos || [],
      },
      comments: [], // Stored separately in subcollection
      popCount: existingStory ? Number(existingStory.popCount || 0) : 0,
      balloonPops: existingStory ? Number(existingStory.balloonPops || 0) : 0,
      achievements: existingStory ? (Array.isArray(existingStory.achievements) ? existingStory.achievements : []) : [],
      celebrationData: processedCelebrationData,
    };

    await docRef.set(savePayload, { merge: true });
    console.log(`[Firestore] Saved free story ${storyId} for email: ${normalizedEmail}`);

    // Trigger Email Delivery with strict idempotency (ONE creation = ONE email)
    const isAlreadySent = existingStory?.emailSent === true || Boolean(existingStory?.emailSentAt);
    let emailSent = isAlreadySent;
    let emailError = '';

    if (normalizedEmail && !isAlreadySent) {
      const origin = req.nextUrl.origin || 'https://jashn.fun';
      const storyUrl = `${origin}/celebrate/preview?storyId=${storyId}`;
      const creatorName = processedCelebrationData.creatorName || processedCelebrationData.names || 'Celebrator';

      try {
        console.log(`[Gmail API] Sending free story link email to: ${normalizedEmail}`);
        const sent = await sendFreeEmailViaGmailAPI(normalizedEmail, creatorName, storyUrl, true);
        if (sent) {
          emailSent = true;
          await docRef.set({
            emailSent: true,
            emailSentAt: new Date().toISOString()
          }, { merge: true });
          console.log(`[Gmail API] Marked emailSent=true for storyId: ${storyId}`);
        } else {
          emailSent = false;
          emailError = 'Gmail API send failed: access token expired or invalid credentials';
          await docRef.set({
            emailSent: false,
            emailError
          }, { merge: true });
        }
      } catch (sendErr: any) {
        console.error('[Gmail API Error]', sendErr);
        emailSent = false;
        emailError = sendErr.message || 'Failed to deliver email';
        await docRef.set({
          emailSent: false,
          emailError
        }, { merge: true });
      }
    } else if (isAlreadySent) {
      console.log(`[Gmail API] Skipping duplicate email for storyId ${storyId} (emailSent is already true).`);
    }

    return NextResponse.json({
      success: true,
      message: 'Free story saved successfully',
      emailSent,
      emailError,
      storyId
    });
  } catch (err: any) {
    console.error('[Free Story API POST Error]', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// sync
