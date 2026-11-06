import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { getClientIp, readBoundedJson } from "@/lib/security";

// Maximum allowable request body size for JSON payloads (4KB)
const MAX_PAYLOAD_BYTES = 4096;

// Rate limiting parameters (5 failed attempts per 15-minute sliding window)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS_PER_IP = 5;
const MAX_FAILED_ATTEMPTS_PER_ACCOUNT = 15; // Distributed brute-force threshold

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  // 1. Enforce actual request body size limit and validate JSON structure via stream reader
  const bodyResult = await readBoundedJson(req, MAX_PAYLOAD_BYTES);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
  }

  const { email: rawEmail, password } = bodyResult.data;

  // Validate required fields
  if (
    typeof rawEmail !== "string" ||
    typeof password !== "string" ||
    password.length === 0 ||
    !password.trim()
  ) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 400 }
    );
  }

  // Bound input lengths: email max 120 chars, password max 72 bytes (bcrypt UTF-8 limit)
  if (rawEmail.length > 120 || password.length > 72 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 400 }
    );
  }

  const email = rawEmail.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 400 }
    );
  }

  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

    // 2. Concurrency-Safe Atomic Database Rate Limiting & Authentication
    // Serializes concurrent attempts for both IP and Account using PostgreSQL advisory locks.
    // If rate-limiting locks or storage are unavailable, the operation fails closed (HTTP 503).
    const authResult = await prisma.$transaction(
      async (tx) => {
        // Acquire transaction-scoped advisory locks for both IP and target account.
        // Uses $queryRaw (mandatory for SELECT queries) and fails closed if locks cannot be acquired.
        try {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${'ip:' + ip}))`;
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${'acc:' + email}))`;
        } catch (lockErr) {
          console.error("CRITICAL: PostgreSQL advisory lock acquisition failed:", lockErr);
          throw new Error("RATE_LIMIT_STORAGE_UNAVAILABLE");
        }

        // Check IP-based throttling (max 5 failed attempts in 15 minutes)
        const ipFailures = await tx.auditLog.count({
          where: {
            action: "LOGIN_FAILED",
            ipAddress: ip,
            createdAt: { gte: windowStart },
          },
        });

        if (ipFailures >= MAX_FAILED_ATTEMPTS_PER_IP) {
          return {
            status: 429,
            error: "Too many failed login attempts from this IP. Security cooldown active. Please try again in 15 minutes.",
          };
        }

        // Fetch targeted admin record
        const admin = await tx.admin.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
            forcePasswordChange: true,
          },
        });

        // Check account-based distributed throttling (protects account against botnets across multiple IPs)
        if (admin) {
          const accountFailures = await tx.auditLog.count({
            where: {
              adminId: admin.id,
              action: "LOGIN_FAILED",
              createdAt: { gte: windowStart },
            },
          });

          if (accountFailures >= MAX_FAILED_ATTEMPTS_PER_ACCOUNT) {
            // Check if current requesting IP is a recognized administrator IP (successful login within 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const isRecognizedIp = await tx.auditLog.findFirst({
              where: {
                adminId: admin.id,
                action: "LOGIN_SUCCESS",
                ipAddress: ip,
                createdAt: { gte: thirtyDaysAgo },
              },
            });

            // If IP is not recognized, enforce temporary 15-minute cooldown on the account
            // This prevents botnet dictionary attacks while ensuring legitimate admin on usual IP is never locked out
            if (!isRecognizedIp) {
              return {
                status: 429,
                error: "High volume of failed login attempts detected for this account. Account is temporarily in a 15-minute security cooldown. Please try again later.",
              };
            }
          }
        }

        // Validate account existence and exact registered admin email
        if (!admin || admin.email !== "maavaishnovideofilm@gmail.com") {
          await tx.auditLog.create({
            data: {
              action: "LOGIN_FAILED",
              entity: "Admin",
              ipAddress: ip,
              metadata: {
                attemptedEmail: email,
                reason: "ACCOUNT_NOT_FOUND",
                userAgent,
              },
            },
          });
          return { status: 401, error: "Invalid email or password" };
        }

        // Verify OWNER role authorization
        if (admin.role !== "OWNER") {
          await tx.auditLog.create({
            data: {
              adminId: admin.id,
              action: "LOGIN_FAILED",
              entity: "Admin",
              entityId: admin.id,
              ipAddress: ip,
              metadata: {
                attemptedEmail: email,
                reason: "UNAUTHORIZED_ROLE",
                userAgent,
              },
            },
          });
          return { status: 401, error: "Invalid email or password" };
        }

        // Verify password against stored hash within the serialized transaction
        const isValid = await verifyPassword(password, admin.passwordHash);
        if (!isValid) {
          await tx.auditLog.create({
            data: {
              adminId: admin.id,
              action: "LOGIN_FAILED",
              entity: "Admin",
              entityId: admin.id,
              ipAddress: ip,
              metadata: {
                attemptedEmail: email,
                reason: "INVALID_CREDENTIALS",
                userAgent,
              },
            },
          });
          return { status: 401, error: "Invalid email or password" };
        }

        // Authentication successful
        return {
          status: 200,
          admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            forcePasswordChange: admin.forcePasswordChange,
          },
        };
      },
      {
        timeout: 5000,
        maxWait: 3000,
      }
    );

    // If authentication failed or was rate limited, return the designated response
    if (authResult.status !== 200 || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const admin = authResult.admin;
    const isPasswordChangeRequired = Boolean(admin.forcePasswordChange);

    // Record successful login audit log reliably
    try {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: isPasswordChangeRequired ? "LOGIN_PASSWORD_CHANGE_REQUIRED" : "LOGIN_SUCCESS",
          entity: "Admin",
          entityId: admin.id,
          ipAddress: ip,
          metadata: {
            userAgent,
            forcePasswordChange: isPasswordChangeRequired,
          },
        },
      });
    } catch (auditErr) {
      console.error("CRITICAL: Failed to write LOGIN_SUCCESS audit log:", auditErr);
    }

    if (isPasswordChangeRequired) {
      // Issue restricted short-lived token (15 mins) for password change only
      const tempToken = await signToken({
        userId: admin.id,
        username: admin.email,
        role: admin.role,
        passwordChangeRequired: true,
      });

      const response = NextResponse.json({
        success: true,
        requiresPasswordChange: true,
        redirectTo: "/admin/change-password",
        message: "First-time security login: Password change is required.",
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: tempToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60, // 15 minutes
      });

      return response;
    }

    // Normal active login: update lastLoginAt
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signToken({
      userId: admin.id,
      username: admin.email,
      role: admin.role,
      passwordChangeRequired: false,
    });

    const response = NextResponse.json({
      success: true,
      requiresPasswordChange: false,
      redirectTo: "/admin/dashboard",
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

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
    if (error?.message === "RATE_LIMIT_STORAGE_UNAVAILABLE") {
      return NextResponse.json(
        { error: "Authentication service temporarily unavailable. Please retry later." },
        { status: 503 }
      );
    }

    console.error("Admin Login Error:", error);
    return NextResponse.json(
      { error: "Authentication service temporarily unavailable. Please retry later." },
      { status: 500 }
    );
  }
}
