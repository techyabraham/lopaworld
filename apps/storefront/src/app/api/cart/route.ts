import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cartCookie, cartFields, retrieveUsableCart } from '../../../lib/cart';
import { isSameOriginRequest } from '../../../lib/request-security';

export async function GET() {
  try {
    const cart = await retrieveUsableCart(cartFields);
    return NextResponse.json({ cart }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Your bag is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'This request could not be verified.' }, { status: 403 });
  const cookieJar = await cookies();
  cookieJar.delete(cartCookie);
  return NextResponse.json({ cart: null }, { headers: { 'Cache-Control': 'no-store' } });
}
