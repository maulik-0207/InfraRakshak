import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 * Receives { email, password } and forwards to backend token endpoint.
 * Stores access and refresh tokens in HttpOnly cookies.
 */
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const backendUrl = 'http://192.168.1.29:8000/api/v1/auth/token/';

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error }, { status: response.status });
  }

  const data = await response.json();
  const access = data.access;
  const refresh = data.refresh;

  const res = NextResponse.json({ 
    success: true,
    role: data.role,
    user: data.user,
    redirect_url: data.redirect_url
  });
  // Set HttpOnly cookies (secure flag omitted for local dev)
  res.cookies.set('access_token', access, { httpOnly: true, path: '/', maxAge: 15 * 60 }); // 15 minutes
  res.cookies.set('refresh_token', refresh, { httpOnly: true, path: '/', maxAge: 7 * 24 * 60 * 60 }); // 7 days
  res.cookies.set('user_role', data.role, { httpOnly: true, path: '/', maxAge: 15 * 60 }); // 15 minutes
  return res;
}
