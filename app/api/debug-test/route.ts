import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreDB } from '../../../lib/firestore';
import { uploadToGCS, downloadFromGCS, getGCSStorage, getGCSBucketName } from '../../../lib/gcs';
import { sendEmailViaGmailAPI } from '../../../lib/gmail';
import { GoogleGenAI } from "@google/genai";
import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import { getFirestore as getClientFirestore, doc as clientDoc, setDoc as clientSetDoc, getDoc as clientGetDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientSecret = searchParams.get('secret') || req.headers.get('x-cron-secret');
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret || clientSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const results: any = {
    firestoreAdmin: { status: 'untested' },
    firestoreClient: { status: 'untested' },
    gcs: { status: 'untested' },
    gmail: { status: 'untested' },
    gemini: { status: 'untested' },
  };

  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let firebaseConfig: any = {};
  try {
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('Failed to read config in test:', err);
  }

  // 1. TEST FIRESTORE ADMIN SDK
  console.log('[DEBUG-TEST] 1. Testing Firestore Admin SDK...');
  try {
    const db = getFirestoreDB();
    const testDocRef = db.collection('debug_tests').doc('test-id-123');
    
    const testData = {
      message: 'Hello Firestore Admin!',
      timestamp: new Date(),
    };
    await testDocRef.set(testData);
    const snap = await testDocRef.get();
    if (snap.exists) {
      results.firestoreAdmin = {
        status: 'success',
        read: snap.data(),
      };
    } else {
      throw new Error('Document written but not found');
    }
  } catch (err: any) {
    results.firestoreAdmin = {
      status: 'failed',
      error: err.message,
      code: err.code,
      details: err.details,
    };
  }

  // 1.2 TEST FIRESTORE CLIENT SDK
  console.log('[DEBUG-TEST] 1.2 Testing Firestore Client SDK...');
  try {
    if (!firebaseConfig.apiKey) {
      throw new Error('No apiKey in firebase-applet-config.json');
    }

    const clientApp = getClientApps().length === 0 
      ? initializeClientApp({
          apiKey: firebaseConfig.apiKey,
          authDomain: firebaseConfig.authDomain,
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket,
          messagingSenderId: firebaseConfig.messagingSenderId,
          appId: firebaseConfig.appId,
        })
      : getClientApps()[0];

    const clientDb = firebaseConfig.firestoreDatabaseId 
      ? getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId)
      : getClientFirestore(clientApp);

    const docRef = clientDoc(clientDb, 'debug_tests', 'client-test-123');
    await clientSetDoc(docRef, {
      message: 'Hello Firestore Client!',
      timestamp: new Date().toISOString(),
    });

    const docSnap = await clientGetDoc(docRef);
    if (docSnap.exists()) {
      results.firestoreClient = {
        status: 'success',
        read: docSnap.data(),
      };
    } else {
      throw new Error('Document written but not found');
    }
  } catch (err: any) {
    results.firestoreClient = {
      status: 'failed',
      error: err.message,
      code: err.code,
    };
  }

  // 1.5 LOG ENVIRONMENT VARS PRESENCE
  const rawKey = process.env.GCS_PRIVATE_KEY || '';
  const hasBeginHeader = rawKey.includes('-----BEGIN PRIVATE KEY-----');
  const hasEndHeader = rawKey.includes('-----END PRIVATE KEY-----');
  const keyLength = rawKey.length;
  const hasLiteralNewlines = rawKey.includes('\\n');
  const hasActualNewlines = rawKey.includes('\n');

  const rawClientId = process.env.GMAIL_CLIENT_ID || '';
  const rawClientSecret = process.env.GMAIL_CLIENT_SECRET || '';
  const rawRefreshToken = process.env.GMAIL_REFRESH_TOKEN || '';
  const rawGcsEmail = process.env.GCS_CLIENT_EMAIL || '';
  const rawGcsProjectId = process.env.GCS_PROJECT_ID || '';
  const rawGcsBucket = process.env.GCS_BUCKET_NAME || '';

  const cleanClientId = rawClientId.trim().replace(/^["']|["']$/g, '');
  const cleanClientSecret = rawClientSecret.trim().replace(/^["']|["']$/g, '');
  const cleanRefreshToken = rawRefreshToken.trim().replace(/^["']|["']$/g, '');
  const cleanGcsEmail = rawGcsEmail.trim().replace(/^["']|["']$/g, '');
  const cleanGcsProjectId = rawGcsProjectId.trim().replace(/^["']|["']$/g, '');
  const cleanGcsBucket = rawGcsBucket.trim().replace(/^["']|["']$/g, '');

  const envStatus = {
    GCS_BUCKET_NAME: {
      rawLength: rawGcsBucket.length,
      cleanLength: cleanGcsBucket.length,
      preview: cleanGcsBucket ? `${cleanGcsBucket.substring(0, 3)}...${cleanGcsBucket.slice(-3)}` : 'missing'
    },
    GCS_PROJECT_ID: {
      rawLength: rawGcsProjectId.length,
      cleanLength: cleanGcsProjectId.length,
      preview: cleanGcsProjectId ? `${cleanGcsProjectId.substring(0, 4)}...${cleanGcsProjectId.slice(-4)}` : 'missing'
    },
    GCS_CLIENT_EMAIL: {
      rawLength: rawGcsEmail.length,
      cleanLength: cleanGcsEmail.length,
      preview: cleanGcsEmail ? `${cleanGcsEmail.substring(0, 5)}...${cleanGcsEmail.slice(-10)}` : 'missing'
    },
    GCS_PRIVATE_KEY: {
      status: keyLength > 0 ? 'present' : 'missing',
      rawLength: keyLength,
      cleanLength: rawKey.trim().replace(/^["']|["']$/g, '').length,
      hasBeginHeader,
      hasEndHeader,
      hasLiteralNewlines,
      hasActualNewlines,
    },
    GMAIL_CLIENT_ID: {
      rawLength: rawClientId.length,
      cleanLength: cleanClientId.length,
      preview: cleanClientId ? `${cleanClientId.substring(0, 8)}...${cleanClientId.slice(-8)}` : 'missing'
    },
    GMAIL_CLIENT_SECRET: {
      rawLength: rawClientSecret.length,
      cleanLength: cleanClientSecret.length,
      preview: cleanClientSecret ? `${cleanClientSecret.substring(0, 4)}...${cleanClientSecret.slice(-4)}` : 'missing'
    },
    GMAIL_REFRESH_TOKEN: {
      rawLength: rawRefreshToken.length,
      cleanLength: cleanRefreshToken.length,
      preview: cleanRefreshToken ? `${cleanRefreshToken.substring(0, 4)}...${cleanRefreshToken.slice(-4)}` : 'missing'
    },
    GMAIL_SENDER_EMAIL: process.env.GMAIL_SENDER_EMAIL || 'not specified (defaults to noreply@jashn.fun)'
  };
  results.env = envStatus;

  // 2. TEST GOOGLE CLOUD STORAGE
  console.log('[DEBUG-TEST] 2. Testing GCS upload/download...');
  try {
    const bucketName = getGCSBucketName();
    const storageClient = getGCSStorage();
    
    let directGcsUploadSuccess = false;
    let directGcsDownloadSuccess = false;
    let directGcsError = null;
    let directGcsFileExists = false;

    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME is not configured in process.env or firebase-applet-config.json');
    }
    if (!storageClient) {
      throw new Error('GCS Storage client could not be initialized. Please check your GCS_PROJECT_ID, GCS_CLIENT_EMAIL, and GCS_PRIVATE_KEY.');
    }

    // Attempt direct GCS upload
    const directTestPath = 'debug_tests/direct_hello.txt';
    const directContent = 'Direct GCS Hello! ' + new Date().toISOString();
    try {
      const bucket = storageClient.bucket(bucketName);
      const file = bucket.file(directTestPath);
      await file.save(directContent, {
        metadata: { contentType: 'text/plain' },
        resumable: false,
      });
      directGcsUploadSuccess = true;

      const [exists] = await file.exists();
      directGcsFileExists = exists;
      if (exists) {
        const [buffer] = await file.download();
        if (buffer.toString() === directContent) {
          directGcsDownloadSuccess = true;
        }
      }
    } catch (directErr: any) {
      directGcsError = {
        message: directErr.message || String(directErr),
        code: directErr.code,
        errors: directErr.errors
      };
    }

    // Run standard wrapper upload/download (to check local fallback)
    const fallbackTestPath = 'debug_tests/hello.txt';
    const fallbackContent = 'Hello GCS! This is a test file ' + new Date().toISOString();
    const fallbackUploadSuccess = await uploadToGCS(fallbackTestPath, Buffer.from(fallbackContent), 'text/plain');
    const fallbackDownloadResult = await downloadFromGCS(fallbackTestPath);

    results.gcs = {
      status: (directGcsUploadSuccess && directGcsDownloadSuccess) ? 'success' : 'failed_direct_or_fallback',
      bucketName,
      storageClientInitialized: !!storageClient,
      directTest: {
        uploadSuccess: directGcsUploadSuccess,
        downloadSuccess: directGcsDownloadSuccess,
        fileExists: directGcsFileExists,
        error: directGcsError,
        path: directTestPath
      },
      fallbackTest: {
        uploadSuccess: fallbackUploadSuccess,
        downloadSuccess: !!fallbackDownloadResult,
        content: fallbackDownloadResult?.buffer?.toString('utf-8') || null,
        path: fallbackTestPath
      }
    };
  } catch (err: any) {
    console.error('[DEBUG-TEST] GCS FAILED:', err);
    results.gcs = {
      status: 'failed',
      error: err.message,
    };
  }

  // 3. TEST GMAIL API
  console.log('[DEBUG-TEST] 3. Testing Gmail API Configuration...');
  try {
    const isGmailConfigured = !!(
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN
    );
    results.gmail.envConfigured = isGmailConfigured;

    if (!isGmailConfigured) {
      results.gmail.status = 'skipped';
      results.gmail.message = 'Gmail API credentials not fully configured in environment variables.';
    } else {
      // Send a test email to the configured GMAIL_SEND_EMAIL or standard test recipient
      const targetEmail = process.env.GMAIL_SEND_EMAIL || 'test@jashn.fun';
      console.log(`[DEBUG-TEST] Attempting to send a test email to ${targetEmail}...`);
      
      await sendEmailViaGmailAPI(
        targetEmail,
        'Aman (Test User)',
        101,
        'https://jashn.fun/celebrate/premium?storyId=debug_test',
        true
      );
      
      console.log('[DEBUG-TEST] Gmail Send: SUCCESS');
      results.gmail.status = 'success';
      results.gmail.recipient = targetEmail;
    }
  } catch (err: any) {
    console.log('[DEBUG-TEST] Gmail test finished with status: inactive / not configured.', err.message);
    results.gmail.status = 'failed';
    results.gmail.error = err.message;
  }

  // 4. TEST GEMINI API
  console.log('[DEBUG-TEST] 4. Testing Gemini API...');
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Write a 1-sentence congrats message for a celebration.",
    });

    console.log('[DEBUG-TEST] Gemini API: SUCCESS');
    results.gemini = {
      status: 'success',
      response: response.text,
    };
  } catch (err: any) {
    console.error('[DEBUG-TEST] Gemini FAILED:', err);
    results.gemini = {
      status: 'failed',
      error: err.message,
    };
  }

  return NextResponse.json({
    success: results.firestoreClient.status === 'success' && results.gcs.status === 'success',
    results
  });
}

// sync
