import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Backend Proxy Middleware for Next.js App Router
 * Enforces separation of concerns by keeping all direct backend communication
 * and JWT manipulation on the server side. The browser frontend only talks to `/api/*`.
 */

// Pull configuration from .env.local (Fallback to local loopback for safety)
// DO NOT append /v1 here as it causes proxy path duplication
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api";

const FETCH_TIMEOUT_MS = 5000;

async function handleProxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathParts } = await params;
  const targetPath = pathParts.join("/");
  const queryString = req.nextUrl.search;
  
  // Construct the URL and sanitize any double slashes caused by path joining (except for the protocol prefix)
  const rawUrl = `${BACKEND_API_URL}/${targetPath}/${queryString}`;
  const targetUrl = rawUrl.replace(/([^:]\/)\/+/g, "$1");

  // Extract necessary headers
  const reqHeaders = new Headers();
  const contentType = req.headers.get("Content-Type");
  if (contentType) reqHeaders.set("Content-Type", contentType);

  // SEPARATION OF CONCERN: 
  // Prefer the client's explicit Authorization header if provided.
  // Otherwise, fallback to the HttpOnly cookie.
  const clientAuth = req.headers.get("Authorization");
  if (clientAuth) {
    reqHeaders.set("Authorization", clientAuth);
  } else {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (token) {
      reqHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  // AbortController ensures we don't hold Next.js threads hostages for 10s if the Django server dies
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // Determine request body if needed
    const isBodyAllowed = ["POST", "PUT", "PATCH"].includes(req.method);
    const body = isBodyAllowed && req.body ? await req.clone().text() : undefined;

    let response = await fetch(targetUrl, {
      method: req.method,
      headers: reqHeaders,
      body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // If unauthorized, attempt token refresh
    if (response.status === 401) {
      const refreshController = new AbortController();
      const refreshTimeoutId = setTimeout(() => refreshController.abort(), FETCH_TIMEOUT_MS);
      
      try {
        const refreshRes = await fetch(`${BACKEND_API_URL}/v1/auth/refresh/`, {
          method: 'POST',
          credentials: 'include',
          signal: refreshController.signal
        });
        clearTimeout(refreshTimeoutId);

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccess = refreshData.access || refreshData.access_token;
          // Update cookie
          const cookieStore = await cookies();
          cookieStore.set('access_token', newAccess, { httpOnly: true, path: '/', maxAge: 15 * 60 });
          // Update Authorization header and retry original request
          reqHeaders.set('Authorization', `Bearer ${newAccess}`);
          
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), FETCH_TIMEOUT_MS);
          
          response = await fetch(targetUrl, {
            method: req.method,
            headers: reqHeaders,
            body,
            signal: retryController.signal
          });
          clearTimeout(retryTimeoutId);
        }
      } catch (err) {
        clearTimeout(refreshTimeoutId);
        console.error("Token refresh failed:", err);
      }
    }

    // Proxy the response safely
    const responseData = await response.text();
    const headers = new Headers();
    const upstreamContentType = response.headers.get("content-type");
    if (upstreamContentType) headers.set("Content-Type", upstreamContentType);

    return new NextResponse(responseData, {
      status: response.status,
      headers: headers,
    });
  } catch (error: any) {
    if (error.name === "AbortError" || error.message.includes("Timeout")) {
      console.error(`[PROXY FAILURE] Django Backend at ${BACKEND_API_URL} timed out after ${FETCH_TIMEOUT_MS}ms. It may be offline.`);
      return NextResponse.json(
        { error: "Service Unavailable. The backend server is currently unreachable or offline." }, 
        { status: 503 }
      );
    }
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Internal Proxy Error" }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const GET = handleProxyRequest;
export const POST = handleProxyRequest;
export const PUT = handleProxyRequest;
export const PATCH = handleProxyRequest;
export const DELETE = handleProxyRequest;
