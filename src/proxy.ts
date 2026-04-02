import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:3000";

/**
 * Calls GET /api/v1/auth/me with the access_token cookie forwarded
 * as an Authorization: Bearer header (since /me reads from header, not cookie).
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) return false;

  try {
    const res = await fetch(`${AUTH_API}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Protected routes: redirect to /login if not authenticated ──────────
  if (pathname.startsWith("/chat") || pathname.startsWith("/profile") || pathname.startsWith("/settings")) {
    const authed = await isAuthenticated(request);
    if (!authed) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // ─── Auth routes: redirect to /chat if already authenticated ────────────
  if (pathname === "/login" || pathname === "/signup") {
    const authed = await isAuthenticated(request);
    if (authed) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/profile/:path*", "/settings/:path*", "/login", "/signup"],
};
