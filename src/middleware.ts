import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "mv_admin_token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only handle /admin routes and protected /api/admin routes
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // Consistent 32-byte JWT secret check
  const secretBytes = process.env.JWT_SECRET
    ? new TextEncoder().encode(process.env.JWT_SECRET)
    : new Uint8Array(0);

  if (secretBytes.length < 32) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Server authentication error: JWT_SECRET misconfigured" },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL("/admin/login?error=server_config", req.url));
  }

  // Allow public admin endpoints without auth
  if (pathname === "/admin/login" || pathname === "/api/admin/auth/login") {
    // If user already has a valid token and tries to access /admin/login, redirect appropriately
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secretBytes, { algorithms: ["HS256"] });
        if (payload?.userId) {
          if (payload.passwordChangeRequired === true) {
            if (pathname === "/admin/login") {
              return NextResponse.redirect(new URL("/admin/change-password", req.url));
            }
          } else {
            if (pathname === "/admin/login") {
              return NextResponse.redirect(new URL("/admin/dashboard", req.url));
            }
          }
        }
      } catch {
        // Token invalid, proceed to login
      }
    }
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    const safeFrom = pathname.startsWith("/admin") ? pathname : "/admin/dashboard";
    loginUrl.searchParams.set("from", safeFrom);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secretBytes, { algorithms: ["HS256"] });

    if (!payload?.userId) {
      throw new Error("Invalid session token payload");
    }

    const isPasswordChangeRequired = payload.passwordChangeRequired === true;

    // Handle mandatory first-time password change routing:
    // Temporary sessions may only access password-change and logout endpoints
    if (isPasswordChangeRequired) {
      const allowedPaths = [
        "/admin/change-password",
        "/api/admin/auth/change-password",
        "/api/admin/auth/logout",
      ];

      if (!allowedPaths.includes(pathname)) {
        if (pathname.startsWith("/api/admin")) {
          return NextResponse.json(
            { error: "Password change is required before accessing administrative endpoints" },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/admin/change-password", req.url));
      }

      return NextResponse.next();
    }

    // Normal sessions cannot access password-change-only routes
    if (pathname === "/admin/change-password") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (pathname === "/api/admin/auth/change-password") {
      return NextResponse.json(
        { error: "Forbidden: password change is not required for this session" },
        { status: 403 }
      );
    }

    // Root /admin redirect
    if (pathname === "/admin" || pathname === "/admin/") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    // Expired or forged token
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Session expired or invalid" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    const safeFrom = pathname.startsWith("/admin") ? pathname : "/admin/dashboard";
    loginUrl.searchParams.set("from", safeFrom);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
