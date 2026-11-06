import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "mv_admin_token";

export function getJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;

  if (!value || Buffer.byteLength(value, "utf8") < 32) {
    throw new Error("JWT_SECRET is missing or too weak. Configure a secret of at least 32 bytes.");
  }

  return new TextEncoder().encode(value);
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: "OWNER";
  passwordChangeRequired?: boolean;
}

export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || Buffer.byteLength(plain, "utf8") > 72) {
    throw new Error("Password exceeds bcrypt maximum length of 72 bytes.");
  }
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    if (typeof plain !== "string" || typeof hash !== "string" || Buffer.byteLength(plain, "utf8") > 72) {
      return false;
    }
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function signToken(
  payload: SessionPayload | (Omit<SessionPayload, "role"> & { role: string })
): Promise<string> {
  if (payload.role !== "OWNER") {
    throw new Error("Unauthorized role: Only OWNER tokens can be issued.");
  }

  const expiresIn = payload.passwordChangeRequired ? "15m" : "24h";

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      payload.role !== "OWNER"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
      role: "OWNER",
      passwordChangeRequired: payload.passwordChangeRequired === true,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the current admin using the Neon database as the source of truth.
 *
 * Session Security Rules:
 * 1. Enforces an exact match between the JWT passwordChangeRequired claim and the database
 *    forcePasswordChange flag. If they mismatch, the session is rejected.
 * 2. If allowPasswordChange is false (normal admin endpoints), sessions requiring a password change
 *    are blocked.
 * 3. If allowPasswordChange is true (password change endpoint), only sessions that actually
 *    require a password change are permitted; normal sessions cannot access password-change-only flows.
 */
export async function getCurrentAdmin(allowPasswordChange = false) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const session = await verifyToken(token);
    if (!session?.userId) return null;

    const admin = await prisma.admin.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        forcePasswordChange: true,
      },
    });

    if (!admin) return null;

    // Reject sessions if the database role is not OWNER, differs from the JWT role,
    // or if the session username does not match the database admin email
    if (
      admin.id !== session.userId ||
      admin.role !== "OWNER" ||
      session.role !== "OWNER" ||
      admin.role !== session.role ||
      session.username.trim().toLowerCase() !== admin.email.trim().toLowerCase()
    ) {
      return null;
    }

    // 1. Enforce exact match between JWT passwordChangeRequired and database forcePasswordChange flag
    const jwtRequiresChange = session.passwordChangeRequired === true;
    const dbRequiresChange = admin.forcePasswordChange === true;
    if (jwtRequiresChange !== dbRequiresChange) {
      return null;
    }

    // 2. Normal admin endpoints block temporary sessions that require a password change
    if (dbRequiresChange && !allowPasswordChange) {
      return null;
    }

    // 3. Password-change-only endpoints block normal sessions that do not require a password change
    if (!dbRequiresChange && allowPasswordChange) {
      return null;
    }

    return {
      ...admin,
      adminId: admin.id,
      username: admin.email,
    };
  } catch (error) {
    console.error("getCurrentAdmin error:", error);
    return null;
  }
}

/**
 * Role-Based Access Control helper
 * OWNER-only authorization model: only OWNER is authorized.
 */
export function hasRequiredRole(adminRole: string, allowedRoles: string[] = ["OWNER"]): boolean {
  if (adminRole !== "OWNER") return false;
  return Array.isArray(allowedRoles) && allowedRoles.includes("OWNER");
}

export async function requireAdminWithRole(allowedRoles: string[] = ["OWNER"]) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { admin: null, error: "Unauthorized access", status: 401 };
  }
  if (!hasRequiredRole(admin.role, allowedRoles)) {
    return { admin: null, error: "Forbidden: insufficient permissions for this action", status: 403 };
  }
  return { admin, error: null, status: 200 };
}

export { COOKIE_NAME };
