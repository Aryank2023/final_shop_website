import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, COOKIE_NAME } from "@/lib/auth";

// Rate limiting for admin logins: max 5 failed attempts per 15 minutes per IP
const loginAttempts = new Map<string, { attempts: number; blockedUntil: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = Date.now();

    const record = loginAttempts.get(ip);
    if (record && record.blockedUntil > now) {
      const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Account access temporarily locked. Try again in ${waitMinutes} minutes.` },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const admin = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username: username.trim() }, { email: username.trim().toLowerCase() }],
      },
    });

    if (!admin || !admin.isActive) {
      // Record failed attempt
      const attempts = (record?.attempts || 0) + 1;
      const blockedUntil = attempts >= 5 ? now + 15 * 60 * 1000 : 0;
      loginAttempts.set(ip, { attempts, blockedUntil });

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      const attempts = (record?.attempts || 0) + 1;
      const blockedUntil = attempts >= 5 ? now + 15 * 60 * 1000 : 0;
      loginAttempts.set(ip, { attempts, blockedUntil });

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Reset failed attempts on success
    loginAttempts.delete(ip);

    // Update lastLoginAt
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Log to Audit Log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "LOGIN",
        ipAddress: ip,
        detailsJson: JSON.stringify({ userAgent: req.headers.get("user-agent") }),
      },
    });

    // Sign JWT
    const token = await signToken({
      userId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });

    // Set secure httpOnly session cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Admin Login Error:", error);
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}
