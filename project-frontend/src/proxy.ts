import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = {
  deo: ["/deo"],
  school: ["/school", "/principal", "/principle"],
  staff: ["/staff"],
  contractor: ["/contractor"],
};

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass for APIs and static files is handled by matcher
  const isProtectedPath = Object.values(protectedRoutes).some(prefixes => 
    prefixes.some(prefix => pathname.startsWith(prefix))
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  const roleCookie = request.cookies.get("user_role")?.value;

  console.log(`>>> [PROXY] Request: ${pathname} | Token: ${token ? "PRESENT" : "MISSING"} | Role: ${roleCookie || "NONE"}`);

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = roleCookie?.toUpperCase();

  // Role Based Routing Logic
  if (pathname.startsWith("/deo")) {
    if (role !== "DEO" && role !== "ADMIN_STAFF") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/school") || pathname.startsWith("/principal") || pathname.startsWith("/principle")) {
    if (role !== "SCHOOL") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/staff")) {
    if (role !== "SCHOOL_STAFF" && role !== "STAFF") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/contractor")) {
    if (role !== "CONTRACTOR") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
