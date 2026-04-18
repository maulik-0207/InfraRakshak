import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/refresh
 * Uses the refresh token cookie to obtain a new access token.
 */
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'Refresh token missing' }, { status: 401 });
  }

  const backendUrl = 'http://192.168.1.29:8000/api/v1/auth/token/refresh/';
  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error }, { status: response.status });
  }

  const data = await response.json();
  const newAccess = data.access || data.access_token;

  const res = NextResponse.json({ success: true });
  res.cookies.set('access_token', newAccess, { httpOnly: true, path: '/', maxAge: 15 * 60 });
  return res;
}
