import { NextResponse } from 'next/server';
import { checkReadiness } from '../../../lib/readiness';

/** Readiness: Payload's database and Medusa both answer within 2 s. Details stay in server logs. */
export async function GET() {
  const { ready, checks } = await checkReadiness();
  return NextResponse.json(
    { status: ready ? 'ready' : 'unavailable', checks },
    { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
