import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, getCurrentAdmin } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";

/**
 * Administrative Logout Handler
 *
 * Server-Side Invalidation Notice:
 * JWT authentication tokens are stateless cryptographic signatures. Deleting the cookie
 * on the client revokes access on that browser. However, without a stateful token blacklist
 * or a database `tokenVersion` field (which would require a database schema migration),
 * any token exfiltrated prior to logout remains cryptographically valid until its expiration
 * timestamp (15 minutes for temporary tokens, 24 hours for normal tokens).
 *
 * For full server-side revocation, a `tokenVersion: Int @default(0)` field on the Admin
 * model must be added when the Prisma migration history is reconciled.
 */
export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json(
      { error: "Forbidden: cross-origin request rejected" },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
  return response;
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
}
