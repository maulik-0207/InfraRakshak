import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Backend Proxy Middleware for Next.js App Router
 * Enforces separation of concerns by keeping all direct backend communication
 * and JWT manipulation on the server side. The browser frontend only talks to `/api/*`.
 */

// Configure this to match your real Python/Django backend
const BACKEND_API_URL = "http://192.168.1.29:8000/api/v1";

async function handleProxyRequest(req: NextRequest, { params }: { params: { path: string[] } }) {
  const pathParts = params?.path || [];
  const targetPath = pathParts.join("/");
  const targetUrl = `${BACKEND_API_URL}/${targetPath}/`; // Assuming trailing slash needed

  // Extract necessary headers
  const reqHeaders = new Headers();
  reqHeaders.set("Content-Type", req.headers.get("Content-Type") || "application/json");

  // SEPARATION OF CONCERN: 
  // If we stored JWT in HttpOnly cookies previously, we attach it here natively
  // without the client ever having access to localStorage JWT.
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (token) {
    reqHeaders.set("Authorization", `Bearer ${token}`);
  }

  try {
    // Determine request body if needed
    const isBodyAllowed = ["POST", "PUT", "PATCH"].includes(req.method);
    const body = isBodyAllowed && req.body ? await req.clone().text() : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: reqHeaders,
      body,
    });

    // We can read headers and proxy the response directly back
    const responseData = await response.text();
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    return new NextResponse(responseData, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Internal Proxy Error" }, { status: 500 });
  }
}

export const GET = handleProxyRequest;
export const POST = handleProxyRequest;
export const PUT = handleProxyRequest;
export const PATCH = handleProxyRequest;
export const DELETE = handleProxyRequest;
