import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 * Receives { email, password } and forwards to backend token endpoint.
 * Stores access and refresh tokens in HttpOnly cookies.
 */
export async function POST(req: NextRequest) {
  console.log(">>> [POST] /api/auth/login called");
  const { email, password } = await req.json();
  const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://192.168.1.29:8000/api';
  const backendUrl = `${BACKEND_API_URL}/v1/auth/token/`;
  console.log(`>>> Proxying login request to: ${backendUrl}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let response;
  try {
    response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError" || error.message.includes("Timeout")) {
      return NextResponse.json({ error: { detail: "Authentication Server Offline. Please wait or check your local server IP." } }, { status: 503 });
    }
    return NextResponse.json({ error: { detail: "Internal Connection Error." } }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    // Graceful parse in case the server returned a plain 401 string or HTML block
    const errorText = await response.text();
    let errorObj = { detail: "Invalid credentials" };
    try { errorObj = JSON.parse(errorText); } catch { }
    return NextResponse.json({ error: errorObj }, { status: response.status });
  }

  const data = await response.json();
  const access = data.access;
  const refresh = data.refresh;

  // Build a user object from the flat JWT response.
  // The backend serializer returns `email` and `role` at the top level, not nested.
  const userPayload = {
    id: 0,                          // not provided by the token endpoint
    email: data.email ?? "",
    username: data.email ?? "",     // use email as username fallback
    role: data.role ?? "",
  };

  const res = NextResponse.json({
    success: true,
    access: access,                 // ← required by login page for setAuth()
    role: data.role,
    user: userPayload,
    redirect_url: data.redirect_url,
  });

  // Set HttpOnly cookies with explicit sameSite for local compatibility
  const cookieOptions = { httpOnly: true, path: '/', maxAge: 15 * 60, sameSite: 'lax' as const };

  res.cookies.set('access_token', access, cookieOptions);
  res.cookies.set('refresh_token', refresh, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });
  res.cookies.set('user_role', data.role, cookieOptions);

  console.log(`>>> [AUTH] Cookies issued for role: ${data.role}`);
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ message: "Login endpoint is active. please use POST." });
}
