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

  const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api';
  const backendUrl = `${BACKEND_API_URL}/v1/auth/token/refresh/`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      let errorObj = { detail: "Failed to refresh token" };
      try { errorObj = JSON.parse(errorData); } catch {}
      return NextResponse.json({ error: errorObj }, { status: response.status });
    }

    const data = await response.json();
    const newAccess = data.access || data.access_token;

    const res = NextResponse.json({ success: true });
    res.cookies.set('access_token', newAccess, { httpOnly: true, path: '/', maxAge: 15 * 60 });
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Refresh service timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Internal refresh proxy error" }, { status: 500 });
  }
}
