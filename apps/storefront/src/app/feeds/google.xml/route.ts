import { NextResponse } from 'next/server';
import { renderProductFeed } from '../../../lib/product-feed';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await renderProductFeed();
  return new NextResponse(result.body, { status: result.status, headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
