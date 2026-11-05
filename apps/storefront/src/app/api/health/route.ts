import { NextResponse } from 'next/server';

/** Liveness: the Node process is serving requests. Deliberately checks no dependency. */
export function GET() {
  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
