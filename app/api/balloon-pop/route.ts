import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreDB } from '../../../lib/firestore';
import { increment } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get('storyId');

    console.log(`[Balloon Pop API GET] Fetch request for storyId: ${storyId || 'none (legacy fallback)'}`);

    if (!storyId) {
      // Fallback/Legacy global pops (website-wide pop counter, but default to 1250)
      const db = getFirestoreDB();
      const globalRef = db.collection('global_stats').doc('balloon_pops');
      const globalSnap = await globalRef.get();
      let globalCount = 1250;
      if (globalSnap.exists) {
        globalCount = globalSnap.data().count || 1250;
      }
      return NextResponse.json({ success: true, count: globalCount });
    }

    const db = getFirestoreDB();
    let docRef = db.collection('free_stories').doc(storyId);
    let docSnap = await docRef.get();

    if (!docSnap.exists) {
      docRef = db.collection('premium_users').doc(storyId);
      docSnap = await docRef.get();
    }

    if (!docSnap.exists) {
      console.warn(`[Balloon Pop API GET] Story ${storyId} not found in free_stories or premium_users. Returning 0 pops.`);
      return NextResponse.json({ success: true, count: 0 });
    }

    const data = docSnap.data();
    // Return story-specific pop counter (supporting both popCount and balloonPops fields)
    const count = data.popCount !== undefined 
      ? data.popCount 
      : (data.balloonPops !== undefined ? data.balloonPops : 0);

    console.log(`[Balloon Pop API GET] Loaded story-specific pops for ${storyId}: ${count}`);
    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    console.error('[Balloon Pop API GET Error]', err);
    // Graceful fallback to avoid breaking client if Firestore is busy
    return NextResponse.json({ success: true, count: 0 });
  }
}

import { checkRateLimit, getEnvLimit } from '../../../lib/rate-limit';
import { isValidId } from '../../../lib/input-validator';

export async function POST(req: NextRequest) {
  try {
    const limit = getEnvLimit('RATE_LIMIT_BALLOON_POPS', 60);
    const { isRateLimited } = checkRateLimit(req, limit, 60 * 1000);
    if (isRateLimited) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { storyId, isPremium, increment: incrementParam = 1 } = body;

    if (storyId && !isValidId(storyId, 128)) {
      return NextResponse.json({ success: false, error: 'Invalid storyId format' }, { status: 400 });
    }
    const incrementVal = Math.min(Math.max(Number(incrementParam) || 1, 1), 50); // Cap increment between 1 and 50

    console.log(`[Balloon Pop API POST] Contribution received. storyId: ${storyId}, isPremium: ${isPremium}, increment: ${incrementVal}`);

    if (!storyId) {
      // Legacy fallback if no storyId is supplied
      const db = getFirestoreDB();
      const globalRef = db.collection('global_stats').doc('balloon_pops');
      await globalRef.update({
        count: increment(incrementVal)
      });
      const globalSnap = await globalRef.get();
      const count = globalSnap.exists ? (globalSnap.data().count || 1250) : 1250;
      return NextResponse.json({
        success: true,
        globalCount: count,
        storyCount: 0
      });
    }

    const db = getFirestoreDB();
    const colName = isPremium ? 'premium_users' : 'free_stories';
    const docRef = db.collection(colName).doc(storyId);

    // Perform atomic increment directly in Firestore database (production-grade concurrency safety)
    console.log(`[Balloon Pop API POST] Executing Firestore atomic increment for story: ${storyId}`);
    
    const updatePayload: any = {
      popCount: increment(incrementVal),
      balloonPops: increment(incrementVal),
      updatedAt: new Date().toISOString()
    };

    await docRef.update(updatePayload);
    console.log(`[Balloon Pop API POST] Atomic increment completed successfully for story: ${storyId}`);

    // Fetch the newly updated count to return in response
    const docSnap = await docRef.get();
    let newStoryPops = 0;
    if (docSnap.exists) {
      const data = docSnap.data();
      newStoryPops = data.popCount !== undefined 
        ? data.popCount 
        : (data.balloonPops !== undefined ? data.balloonPops : 0);
    }

    // Trigger achievement unlocking checks logs
    console.log(`[Balloon Pop API POST] Story ${storyId} pop counter is now: ${newStoryPops}`);
    
    return NextResponse.json({
      success: true,
      globalCount: newStoryPops, // Front-end maps globalPopCount to story pops
      storyCount: newStoryPops
    });
  } catch (err: any) {
    console.error('[Balloon Pop API POST Error]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// sync
