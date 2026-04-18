import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define the routes that strictly exist under the unified Dashboard scope
const protectedPrefixes = ["/dashboard", "/reports", "/contracts", "/admin", "/principal"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires protection
  const isProtected = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

  if (isProtected) {
    // Rely exclusively on the proxy dropping the secure 'access_token' cookie
    // If it's missing, the session is fully dead on the server side.
    const token = request.cookies.get("access_token");

    if (!token) {
      // User is completely unauthenticated or proxy token expired. Evict to login.
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Ensure the middleware runs against all potential dashboard routes 
  // bypassing static files and the API endpoints directly.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
