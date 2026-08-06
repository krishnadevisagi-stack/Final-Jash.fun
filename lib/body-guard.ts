import { NextRequest, NextResponse } from 'next/server';

export function enforceMaxBodySize(req: NextRequest, maxBytes: number = 2 * 1024 * 1024): NextResponse | null {
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const parsedLength = parseInt(contentLength, 10);
    if (!isNaN(parsedLength) && parsedLength > maxBytes) {
      return NextResponse.json({ success: false, error: 'Payload Too Large' }, { status: 413 });
    }
  }
  return null;
}
