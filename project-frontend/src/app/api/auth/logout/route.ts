import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Clears authentication cookies.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });
  // Clear cookies by setting maxAge=0
  res.cookies.set('access_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
