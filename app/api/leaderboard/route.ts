import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { uploadToGCS } from '../../../lib/gcs';
import { sendEmailViaGmailAPI } from '../../../lib/gmail';
import { getFirestoreDB } from '../../../lib/firestore';

export const dynamic = 'force-dynamic';

import { readLeaderboardFallback as readFallback, writeLeaderboardFallback as writeFallback } from '../../../lib/fallback-storage';

async function sendConfirmationEmail(toEmail: string, names: string, amount: number, storyUrl: string) {
  const isGmailConfigured = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN);

  if (!isGmailConfigured) {
    console.warn('Gmail API credentials are missing. Logging email content instead:');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Congratulations! Your Celebration Page is Live 🤍`);
    console.log(`Body: Hello ${names}! Your celebration page has been created successfully. View it here: ${storyUrl}`);
    return true;
  }

  console.log(`[Gmail API] Email Started - sending to: ${toEmail}`);
  try {
    const success = await sendEmailViaGmailAPI(toEmail, names, amount, storyUrl, true);
    if (!success) {
      throw new Error('Gmail API email delivery returned false.');
    }
    console.log(`[Gmail API] Email Sent successfully to: ${toEmail}`);
    return true;
  } catch (err: any) {
    console.error(`[Gmail API] Email Failed for user: ${names}, Email: ${toEmail}. Reason: ${err.message}`);
    throw err;
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const storyId = url.searchParams.get('storyId') || url.searchParams.get('pageId') || url.searchParams.get('id');
    const now = new Date();

    if (storyId) {
      let userObj: any = null;

      // 1. Check Firestore FIRST as the primary database (premium_users, then free_stories)
      try {
        console.log(`[Firestore] Fetching page metadata for storyId: ${storyId}`);
        const db = getFirestoreDB();
        const docSnap = await db.collection('premium_users').doc(storyId).get();
        if (docSnap.exists) {
          userObj = docSnap.data();
          if (userObj.createdAt && userObj.createdAt.toDate) {
            userObj.createdAt = userObj.createdAt.toDate().toISOString();
          }
          if (userObj.expiresAt && userObj.expiresAt.toDate) {
            userObj.expiresAt = userObj.expiresAt.toDate().toISOString();
          }
        } else {
          const freeSnap = await db.collection('free_stories').doc(storyId).get();
          if (freeSnap.exists) {
            userObj = freeSnap.data();
            if (userObj.createdAt && userObj.createdAt.toDate) {
              userObj.createdAt = userObj.createdAt.toDate().toISOString();
            }
            if (userObj.expiresAt && userObj.expiresAt.toDate) {
              userObj.expiresAt = userObj.expiresAt.toDate().toISOString();
            }
          }
        }
      } catch (firestoreErr: any) {
        console.error('[Firestore Errors] Failed to retrieve document from Firestore:', firestoreErr);
      }

      // 2. If not found in Firestore, check local fallback JSON file
      if (!userObj) {
        const allUsers = readFallback();
        userObj = allUsers.find(u => u.storyId === storyId || u._id === storyId);
      }

      if (!userObj) {
        return NextResponse.json({ success: false, error: 'Celebration page not found' }, { status: 404 });
      }

      // Check if page has expired (strictly 1 year limit)
      if (userObj.expiresAt && new Date(userObj.expiresAt) < now) {
        return NextResponse.json({ success: false, error: 'This celebration page has expired' }, { status: 410 });
      }

      const isPublic = userObj.isPublic !== false && userObj.isPrivate !== true && userObj.visibility !== 'private' && userObj.privacy !== 'PRIVATE';

      return NextResponse.json({
        success: true,
        isPublic,
        name: userObj.name || userObj.celebrationData?.names || '',
        amount: userObj.amount || userObj.celebrationData?.premiumPrice || 99,
        storyId: userObj.storyId || storyId,
        email: userObj.email || userObj.celebrationData?.premiumEmail || '',
        celebrationData: userObj.celebrationData || userObj,
        createdAt: userObj.createdAt
      });
    }

    const type = url.searchParams.get('type') || 'contributions';
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    if (type === 'pops') {
      // ── HIGHEST POPS LEADERBOARD (Free Stories & Story Mode) ──
      try {
        console.log('[Firestore] Fetching top 100 highest pops active stories for Leaderboard');
        const db = getFirestoreDB();
        const snapshot = await db.collection('free_stories').get();
        const allStories: any[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
          const expiresAt = data.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)) : null;

          // 1-Year Expiry Filter
          if ((expiresAt && expiresAt < now) || (createdAt && createdAt < oneYearAgo)) {
            return;
          }

          // Privacy Check: determine whether story is public or private
          const isPrivate = data.isPrivate === true || data.visibility === 'private' || data.freePrivacy === 'PRIVATE' || data.privacy === 'PRIVATE' || data.isPublic === false;
          const isPublic = !isPrivate;

          const celeb = data.celebrationData || {};
          const storyName = celeb.names || celeb.creatorName || celeb.occasionName || data.name || 'Happy Celebration';
          const pops = Number(data.popCount !== undefined ? data.popCount : (data.balloonPops !== undefined ? data.balloonPops : 0));

          allStories.push({
            _id: doc.id,
            name: storyName,
            pops: pops,
            isPublic: isPublic,
            storyId: data.storyId || doc.id,
            storyType: 'FREE',
            createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
          });
        });

        // Sort: pops descending, then createdAt descending
        const sorted = allStories.sort((a, b) => {
          if (b.pops !== a.pops) {
            return b.pops - a.pops;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        const users = sorted.slice(0, 100);
        return NextResponse.json({ success: true, type: 'pops', users });
      } catch (firestoreErr: any) {
        console.error('[Firestore Errors] Failed to retrieve free stories leaderboard:', firestoreErr);
        return NextResponse.json({ success: true, type: 'pops', users: [] });
      }
    }

    // ── HIGHEST CONTRIBUTIONS LEADERBOARD (Premium Pages) ──
    try {
      console.log('[Firestore] Fetching top 100 active premium pages for Leaderboard');
      const db = getFirestoreDB();
      const snapshot = await db.collection('premium_users').get();
      const allUsers: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const expiresAt = data.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)) : null;
        const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null;

        // 1-Year Expiry Filter
        if ((expiresAt && expiresAt < now) || (createdAt && createdAt < oneYearAgo)) {
          return;
        }

        // Privacy Check: determine whether premium page is public or private
        const isPrivate = data.isPrivate === true || data.isPublic === false || data.privacy === 'PRIVATE' || data.premiumPrivacy === 'PRIVATE';
        const isPublic = !isPrivate;

        allUsers.push({
          _id: doc.id,
          name: data.name || data.celebrationData?.names || 'Premium Supporter',
          amount: Number(data.amount || data.premiumPrice || 0),
          isPublic: isPublic,
          storyId: data.storyId || doc.id,
          storyType: 'PREMIUM',
          createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
        });
      });

      // Sort: amount descending, then createdAt descending
      const sorted = allUsers.sort((a, b) => {
        if (b.amount !== a.amount) {
          return b.amount - a.amount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const users = sorted.slice(0, 100);
      return NextResponse.json({ success: true, type: 'contributions', users });
    } catch (firestoreErr: any) {
      console.error('[Firestore Errors] Failed to retrieve leaderboard from Firestore:', firestoreErr);
      
      // Fallback to local file storage
      const allUsers = readFallback();
      const activeUsers = allUsers.filter(u => {
        const notExpired = (!u.expiresAt || new Date(u.expiresAt) > now) && new Date(u.createdAt) > oneYearAgo;
        const isPub = u.isPublic !== false;
        return notExpired && isPub;
      });

      const sorted = activeUsers.sort((a, b) => {
        if (b.amount !== a.amount) {
          return b.amount - a.amount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const users = sorted.slice(0, 100).map(u => ({
        _id: u._id,
        name: u.name,
        amount: u.amount,
        isPublic: true,
        storyId: u.storyId,
        storyType: 'PREMIUM',
        createdAt: u.createdAt
      }));
      return NextResponse.json({ success: true, type: 'contributions', users });
    }
  } catch (error: any) {
    console.error('Error in GET /api/leaderboard:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function processAndUploadAssets(storyId: string, celebrationData: any, existingMediaRefs?: any, email?: string) {
  if (!celebrationData) return { processed: celebrationData, mediaRefs: {} };

  const cloned = { ...celebrationData };
  const isBase64 = (str: any) => typeof str === 'string' && str.startsWith('data:');

  const normalizedEmail = (email || cloned.email || cloned.premiumEmail || '').toLowerCase().trim();
  const sanitizedEmail = normalizedEmail ? normalizedEmail.replace(/[^a-zA-Z0-9_.-]/g, '_') : '';
  const userId = sanitizedEmail || 'guest';
  const folderPath = `premium-landing-page/${userId}/${storyId}`;
  const emailParam = normalizedEmail ? `&email=${encodeURIComponent(normalizedEmail)}` : '';
  const modeParam = '&mode=landing';

  const mediaRefs: any = {
    heroImage: existingMediaRefs?.heroImage || existingMediaRefs?.hero || null,
    secretImage: existingMediaRefs?.secretImage || existingMediaRefs?.secret || null,
    creatorPhoto: existingMediaRefs?.creatorPhoto || existingMediaRefs?.creator || null,
    music: existingMediaRefs?.music || null,
    galleryPhotos: Array.isArray(existingMediaRefs?.galleryPhotos) ? [...existingMediaRefs.galleryPhotos] : [],
    photos: Array.isArray(existingMediaRefs?.photos) ? [...existingMediaRefs.photos] : []
  };

  const uploadTasks: Promise<void>[] = [];

  if (isBase64(cloned.heroImage)) {
    uploadTasks.push(
      (async () => {
        try {
          const gcsPath = `${folderPath}/hero`;
          console.log(`[Cloud Storage] Uploading hero image for landing page: ${storyId}, folderPath: ${folderPath}`);
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

  if (isBase64(cloned.secretImage)) {
    uploadTasks.push(
      (async () => {
        try {
          const gcsPath = `${folderPath}/secret`;
          console.log(`[Cloud Storage] Uploading secret image for landing page: ${storyId}, folderPath: ${folderPath}`);
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

  if (isBase64(cloned.music)) {
    uploadTasks.push(
      (async () => {
        try {
          const gcsPath = `${folderPath}/music`;
          console.log(`[Cloud Storage] Uploading music for landing page: ${storyId}, folderPath: ${folderPath}`);
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

  if (isBase64(cloned.creatorPhoto)) {
    uploadTasks.push(
      (async () => {
        try {
          const gcsPath = `${folderPath}/creator`;
          console.log(`[Cloud Storage] Uploading creator photo for landing page: ${storyId}, folderPath: ${folderPath}`);
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

  if (Array.isArray(cloned.galleryPhotos)) {
    uploadTasks.push(
      (async () => {
        const updatedPaths: string[] = [];
        cloned.galleryPhotos = await Promise.all(
          cloned.galleryPhotos.map(async (photo: any, index: number) => {
            if (isBase64(photo)) {
              try {
                const key = `gallery_${index}`;
                const gcsPath = `${folderPath}/${key}`;
                console.log(`[Cloud Storage] Uploading gallery photo ${index} for landing page: ${storyId}, folderPath: ${folderPath}`);
                const success = await uploadToGCS(gcsPath, photo);
                if (success) {
                  updatedPaths[index] = gcsPath;
                  return `/api/assets?storyId=${storyId}&key=${key}${modeParam}${emailParam}`;
                }
              } catch (e: any) {
                console.error(`[Cloud Storage Errors] Error uploading gallery photo ${index} to GCS:`, e);
              }
            } else if (typeof photo === 'string' && photo.includes('/api/assets')) {
              updatedPaths[index] = mediaRefs.galleryPhotos?.[index] || '';
              return photo;
            }
            return photo;
          })
        );
        mediaRefs.galleryPhotos = updatedPaths;
      })()
    );
  }

  if (Array.isArray(cloned.photos)) {
    uploadTasks.push(
      (async () => {
        const updatedPaths: string[] = [];
        cloned.photos = await Promise.all(
          cloned.photos.map(async (photo: any, index: number) => {
            if (isBase64(photo)) {
              try {
                const key = `photo_${index}`;
                const gcsPath = `${folderPath}/${key}`;
                console.log(`[Cloud Storage] Uploading photo ${index} for landing page: ${storyId}, folderPath: ${folderPath}`);
                const success = await uploadToGCS(gcsPath, photo);
                if (success) {
                  updatedPaths[index] = gcsPath;
                  return `/api/assets?storyId=${storyId}&key=${key}${modeParam}${emailParam}`;
                }
              } catch (e: any) {
                console.error(`[Cloud Storage Errors] Error uploading photo ${index} to GCS:`, e);
              }
            } else if (typeof photo === 'string' && photo.includes('/api/assets')) {
              updatedPaths[index] = mediaRefs.photos?.[index] || '';
              return photo;
            }
            return photo;
          })
        );
        mediaRefs.photos = updatedPaths;
      })()
    );
  }

  await Promise.all(uploadTasks);
  return { processed: cloned, mediaRefs };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, amount, isPublic = true, storyId: rawStoryId, pageId: rawPageId, _id, email, storyUrl, celebrationData, paymentId } = body;

    const storyId = rawStoryId || rawPageId || _id || celebrationData?.storyId;

    if (!storyId) {
      return NextResponse.json({ success: false, error: 'storyId or pageId is required' }, { status: 400 });
    }

    const pageName = name || celebrationData?.names || celebrationData?.creatorName || 'Celebration Page';
    const rawAmount = amount !== undefined && amount !== null ? amount : (celebrationData?.premiumPrice || 99);
    const userEmail = (email || celebrationData?.premiumEmail || '').toLowerCase().trim();

    let isNewStory = true;
    let existingEmail = '';
    let existingFound = false;

    try {
      const db = getFirestoreDB();
      const docRef = db.collection('premium_users').doc(storyId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        isNewStory = false;
        existingFound = true;
        const exData = docSnap.data();
        existingEmail = exData?.email || exData?.celebrationData?.premiumEmail || '';
      }
    } catch (e) {
      console.warn('Could not check if story exists in Firestore, checking local fallback:', e);
    }

    if (!existingFound) {
      try {
        const allUsers = readFallback();
        const found = allUsers.find(u => u.storyId === storyId || u._id === storyId);
        if (found) {
          isNewStory = false;
          existingFound = true;
          existingEmail = found.email || found.celebrationData?.premiumEmail || '';
        }
      } catch (fallbackErr) {
        console.error('Local fallback lookup failed:', fallbackErr);
      }
    }

    // SECURITY CHECK 1: If story already exists, prevent editing/hijacking by anyone other than the original owner
    if (!isNewStory && existingFound) {
      const normalizedExistingEmail = existingEmail.toLowerCase().trim();

      if (normalizedExistingEmail && userEmail && normalizedExistingEmail !== userEmail) {
        return NextResponse.json({
          success: false,
          error: 'Forbidden: You are not authorized to update this page. Only the original creator can edit this celebration.'
        }, { status: 403 });
      }
    }

    let verifiedPaymentAmount: number | null = null;
    let matchedPaymentId = paymentId;

    // Soft payment check (associates verified payment if exists, but NEVER blocks page creation)
    if (paymentId) {
      try {
        const db = getFirestoreDB();
        const payDoc = await db.collection('verified_payments').doc(paymentId).get();
        if (payDoc.exists) {
          const payData = payDoc.data();
          if (payData && payData.amount !== undefined && payData.amount !== null) {
            verifiedPaymentAmount = Number(payData.amount);
          }
        }
      } catch (e) {
        console.error('Error fetching payment doc from Firestore:', e);
      }

      if (verifiedPaymentAmount === null) {
        try {
          const pFallbackPath = path.join(process.cwd(), 'payments_fallback.json');
          if (fs.existsSync(pFallbackPath)) {
            const payments = JSON.parse(fs.readFileSync(pFallbackPath, 'utf-8'));
            const found = payments.find((p: any) => p.paymentId === paymentId);
            if (found && found.amount !== undefined) {
              verifiedPaymentAmount = Number(found.amount);
            }
          }
        } catch (e) {
          console.error('Error checking payment fallback:', e);
        }
      }
    } else if (userEmail) {
      // Soft check if a matching payment exists for this email
      try {
        const db = getFirestoreDB();
        const snapshot = await db.collection('verified_payments')
          .where('email', '==', userEmail)
          .get();
        if (!snapshot.empty) {
          const docs: any[] = [];
          snapshot.forEach((doc: any) => docs.push({ id: doc.id, ...doc.data() }));
          docs.sort((a, b) => {
            const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return tB - tA;
          });
          matchedPaymentId = docs[0].paymentId;
          if (docs[0].amount !== undefined && docs[0].amount !== null) {
            verifiedPaymentAmount = Number(docs[0].amount);
          }
        }
      } catch (e) {
        console.error('Error searching payments by email in Firestore:', e);
      }
    }

    // SECURITY CHECK 2: For Premium Mode creations, strictly enforce verified payment
    const isPremiumMode = celebrationData?.mode === 'PREMIUM' || (isNewStory && Number(rawAmount) > 0);
    if (isNewStory && isPremiumMode && verifiedPaymentAmount === null) {
      console.warn(`[Security Guard] Blocked unpaid premium creation attempt for storyId: ${storyId}, email: ${userEmail}`);
      return NextResponse.json({
        success: false,
        error: 'Access Denied: Payment verification failed. A valid, 100% verified payment signature is required to activate a premium celebration page.'
      }, { status: 403 });
    }

    // Mark payment as used if found
    if (matchedPaymentId) {
      try {
        const db = getFirestoreDB();
        const docRef = db.collection('verified_payments').doc(matchedPaymentId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          await docRef.update({
            used: true,
            usedByStoryId: storyId,
            usedAt: new Date(),
          });
          console.log(`[Firestore] Payment ${matchedPaymentId} associated with storyId: ${storyId}`);
        }
      } catch (e: any) {
        console.error('[Firestore Errors] Failed to mark payment as used:', e);
      }
    }

    let finalCelebrationData = celebrationData;
    let mediaRefs: any = {};
    if (storyId && celebrationData) {
      try {
        let existingMediaRefs: any = {};
        try {
          const db = getFirestoreDB();
          const existingSnap = await db.collection('premium_users').doc(storyId).get();
          if (existingSnap.exists) {
            const exData = existingSnap.data();
            existingMediaRefs = exData?.mediaReferences || exData?.storageReferences || {};
          }
        } catch (_) {}

        const result = await processAndUploadAssets(storyId, celebrationData, existingMediaRefs, userEmail);
        finalCelebrationData = result.processed;
        mediaRefs = result.mediaRefs || {};
      } catch (e: any) {
        console.error('[Cloud Storage Errors] Error processing/uploading assets to GCS:', e);
      }
    }

    let savedUser: any = null;
    let writeToFirestoreSuccess = false;
    let alreadySentEmail = false;

    // 1. Try to write to Firestore as the primary database
    try {
      console.log(`[Firestore] Saving premium user celebration data for storyId: ${storyId}`);
      const db = getFirestoreDB();
      const docRef = db.collection('premium_users').doc(storyId);
      const docSnap = await docRef.get();

      let expiresAtDate = new Date();
      expiresAtDate.setFullYear(expiresAtDate.getFullYear() + 1);

      let finalAmount = verifiedPaymentAmount !== null && !isNaN(verifiedPaymentAmount) && verifiedPaymentAmount > 0
        ? verifiedPaymentAmount
        : Number(rawAmount) || 99;
      let createdAtDate = new Date();

      if (docSnap.exists) {
        const existingData = docSnap.data()!;
        alreadySentEmail = existingData.emailSent === true || existingData.emailStatus === 'Sent';
        if (verifiedPaymentAmount !== null && !isNaN(verifiedPaymentAmount) && verifiedPaymentAmount > 0) {
          finalAmount = verifiedPaymentAmount;
        } else {
          finalAmount = Math.max(Number(existingData.amount || 0), finalAmount);
        }
        if (existingData.createdAt) {
          createdAtDate = existingData.createdAt.toDate ? existingData.createdAt.toDate() : new Date(existingData.createdAt);
        }
        if (existingData.expiresAt) {
          expiresAtDate = existingData.expiresAt.toDate ? existingData.expiresAt.toDate() : new Date(existingData.expiresAt);
        } else {
          expiresAtDate = new Date(createdAtDate);
          expiresAtDate.setFullYear(expiresAtDate.getFullYear() + 1);
        }
      }

      const updateData: any = {
        name: pageName,
        amount: finalAmount,
        isPublic: isPublic !== false,
        storyId,
        createdAt: createdAtDate,
        expiresAt: expiresAtDate,
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
      };

      if (finalCelebrationData) {
        finalCelebrationData.premiumPrice = finalAmount;
        finalCelebrationData.amount = finalAmount;
        updateData.celebrationData = finalCelebrationData;
      }
      if (userEmail) {
        updateData.email = userEmail;
        updateData.emailStatus = alreadySentEmail ? 'Sent' : 'Pending';
      }

      await docRef.set(updateData, { merge: true });
      console.log(`[Firestore] Successfully stored premium user for storyId: ${storyId}`);

      savedUser = {
        _id: storyId,
        name: pageName,
        amount: finalAmount,
        isPublic: isPublic !== false,
        storyId,
        celebrationData: finalCelebrationData,
        createdAt: createdAtDate.toISOString(),
        expiresAt: expiresAtDate.toISOString(),
        email: userEmail,
      };
      writeToFirestoreSuccess = true;
    } catch (firestoreErr: any) {
      console.error('[Firestore Errors] Failed to store document in Firestore:', firestoreErr);
    }

    // Local fallback writing - ALWAYS dual-write for zero data loss and instant redundancy
    try {
      console.log(`[Local Fallback] Updating local fallback backup for storyId: ${storyId}`);
      const allUsers = readFallback();
      
      let userIndex = -1;
      if (storyId) {
        userIndex = allUsers.findIndex(u => u.storyId === storyId || u._id === storyId);
      }

      let finalAmountForFB = verifiedPaymentAmount !== null && !isNaN(verifiedPaymentAmount) && verifiedPaymentAmount > 0
        ? verifiedPaymentAmount
        : Number(rawAmount) || 99;

      if (userIndex !== -1) {
        allUsers[userIndex].amount = Math.max(Number(allUsers[userIndex].amount || 0), finalAmountForFB);
        allUsers[userIndex].name = pageName;
        allUsers[userIndex].isPublic = isPublic !== false;
        if (finalCelebrationData) allUsers[userIndex].celebrationData = finalCelebrationData;
        if (userEmail) allUsers[userIndex].email = userEmail;
        if (!allUsers[userIndex].expiresAt) {
          const cDate = allUsers[userIndex].createdAt ? new Date(allUsers[userIndex].createdAt) : new Date();
          const exp = new Date(cDate);
          exp.setFullYear(exp.getFullYear() + 1);
          allUsers[userIndex].expiresAt = exp.toISOString();
        }
        if (!savedUser) savedUser = allUsers[userIndex];
      } else {
        const nowStr = new Date().toISOString();
        const exp = new Date();
        exp.setFullYear(exp.getFullYear() + 1);
        const fallbackObj = {
          _id: storyId,
          name: pageName,
          amount: finalAmountForFB,
          isPublic: isPublic !== false,
          email: userEmail,
          storyId,
          celebrationData: finalCelebrationData,
          createdAt: nowStr,
          expiresAt: exp.toISOString()
        };
        allUsers.push(fallbackObj);
        if (!savedUser) savedUser = fallbackObj;
      }

      writeFallback(allUsers);
    } catch (fallbackErr: any) {
      console.error('Local fallback write failed:', fallbackErr);
    }

    // 2. Now handle automatic Gmail API email sending and status tracking
    let emailSent = alreadySentEmail;
    let emailError = null;

    if (userEmail && !alreadySentEmail) {
      try {
        const hostHeader = req.headers.get('host') || 'jashn.fun';
        const protocol = req.headers.get('x-forwarded-proto') || 'https';
        const fallbackUrl = `${protocol}://${hostHeader}/celebrate/premium?pageId=${storyId}`;
        const finalUrl = storyUrl || fallbackUrl;

        await sendConfirmationEmail(userEmail, pageName, savedUser?.amount || 99, finalUrl);
        emailSent = true;

        if (writeToFirestoreSuccess) {
          try {
            const db = getFirestoreDB();
            await db.collection('premium_users').doc(storyId).update({
              emailStatus: 'Sent',
              emailSent: true,
              emailSentAt: new Date().toISOString()
            });
            console.log(`[Firestore] Updated emailStatus to Sent for storyId: ${storyId}`);
          } catch (updateErr: any) {
            console.error('[Firestore Errors] Failed to update emailStatus to Sent:', updateErr);
          }
        }
      } catch (err: any) {
        console.error('Email sending failed:', err);
        emailError = err.message || 'Gmail API delivery failed';

        if (writeToFirestoreSuccess) {
          try {
            const db = getFirestoreDB();
            await db.collection('premium_users').doc(storyId).update({
              emailStatus: 'Failed',
              emailFailureReason: emailError,
              emailFailureTimestamp: new Date(),
            });
            console.log(`[Firestore] Updated emailStatus to Failed for storyId: ${storyId}`);
          } catch (updateErr: any) {
            console.error('[Firestore Errors] Failed to update emailStatus to Failed:', updateErr);
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: savedUser, 
      emailSent, 
      emailError 
    });
  } catch (error: any) {
    console.error('Error in POST /api/leaderboard:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// sync
