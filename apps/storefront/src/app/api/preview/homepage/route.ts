import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.PREVIEW_SECRET;
  if (!secret || url.searchParams.get('secret') !== secret) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const draft = await draftMode();
  draft.enable();
  return NextResponse.redirect(new URL('/preview/homepage', request.url), { headers: { 'Cache-Control': 'no-store' } });
}
