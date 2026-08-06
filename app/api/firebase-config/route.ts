import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return NextResponse.json({
        success: true,
        config: {
          projectId: config.projectId,
          appId: config.appId,
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          firestoreDatabaseId: config.firestoreDatabaseId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
        }
      });
    }
  } catch (err: any) {
    console.error('[Firebase Config API Error]', err);
  }
  return NextResponse.json({ success: false, error: 'Firebase configuration not found' }, { status: 404 });
}

// sync
