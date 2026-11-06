import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentAdmin,
  verifyPassword,
  hashPassword,
  signToken,
  COOKIE_NAME,
} from "@/lib/auth";
import { getClientIp, readBoundedJson, verifyCsrfOrigin } from "@/lib/security";

const MAX_PASSWORD_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  // 1. Verify CSRF Origin
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json(
      { error: "Forbidden: cross-origin request rejected" },
      { status: 403 }
    );
  }

  const ip = getClientIp(req);

  try {
    // 2. Allow only administrators who must change their password
    const admin = await getCurrentAdmin(true);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized or session expired. Please sign in again." },
        { status: 401 }
      );
    }

    if (!admin.forcePasswordChange) {
      return NextResponse.json(
        { error: "Password change is not required for this session" },
        { status: 403 }
      );
    }

    // 3. Throttle failed password change attempts
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentFailures = await prisma.auditLog.count({
      where: {
        adminId: admin.id,
        action: "PASSWORD_CHANGE_FAILED",
        createdAt: { gte: windowStart },
      },
    });

    if (recentFailures >= MAX_PASSWORD_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many failed password attempts. Please wait 15 minutes before retrying." },
        { status: 429 }
      );
    }

    // 4. Enforce real 4KB request body limit using stream reader
    const bodyResult = await readBoundedJson(req, 4096);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const { currentPassword, newPassword, confirmPassword } = bodyResult.data;

    // Validate that all password fields are non-empty strings
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      return NextResponse.json(
        { error: "All password fields are required and must be non-empty strings" },
        { status: 400 }
      );
    }

    // Reject password inputs exceeding bcrypt's maximum 72-byte cryptographic limit
    if (
      currentPassword.length > 72 ||
      Buffer.byteLength(currentPassword, "utf8") > 72 ||
      newPassword.length > 72 ||
      Buffer.byteLength(newPassword, "utf8") > 72 ||
      confirmPassword.length > 72 ||
      Buffer.byteLength(confirmPassword, "utf8") > 72
    ) {
      return NextResponse.json(
        { error: "Password fields cannot exceed 72 bytes in length" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation do not match" },
        { status: 400 }
      );
    }

    // Password strength policy
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: "New password must contain at least one uppercase letter (A-Z)" },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json(
        { error: "New password must contain at least one lowercase letter (a-z)" },
        { status: 400 }
      );
    }

    if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return NextResponse.json(
        { error: "New password must contain at least one number or special character" },
        { status: 400 }
      );
    }

    // Verify current password against database
    const dbAdmin = await prisma.admin.findUnique({
      where: { id: admin.id },
    });

    if (!dbAdmin) {
      return NextResponse.json({ error: "Administrator account not found" }, { status: 404 });
    }

    if (dbAdmin.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only OWNER accounts may perform this action" },
        { status: 403 }
      );
    }

    const isCurrentValid = await verifyPassword(currentPassword, dbAdmin.passwordHash);
    if (!isCurrentValid) {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "PASSWORD_CHANGE_FAILED",
          entity: "Admin",
          entityId: admin.id,
          ipAddress: ip,
          metadata: { reason: "INVALID_CURRENT_PASSWORD" },
        },
      });

      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Prevent reuse of current password
    if (currentPassword === newPassword || (await verifyPassword(newPassword, dbAdmin.passwordHash))) {
      return NextResponse.json(
        { error: "New password cannot be identical to your current password" },
        { status: 400 }
      );
    }

    // Hash new password securely with bcrypt cost 12
    const newHash = await hashPassword(newPassword);

    // Update Admin and record Audit Log in a single atomic transaction
    await prisma.$transaction(async (tx) => {
      await tx.admin.update({
        where: { id: admin.id },
        data: {
          passwordHash: newHash,
          forcePasswordChange: false,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: "PASSWORD_CHANGED",
          entity: "Admin",
          entityId: admin.id,
          ipAddress: ip,
          metadata: { reason: "PASSWORD_CHANGE_SUCCESS" },
        },
      });
    });

    // Issue new full-access 24-hour token
    const fullToken = await signToken({
      userId: admin.id,
      username: admin.email,
      role: "OWNER",
      passwordChangeRequired: false,
    });

    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully! Redirecting to dashboard...",
      redirectTo: "/admin/dashboard",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: fullToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Change Password Error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred while updating the password." },
      { status: 500 }
    );
  }
}
