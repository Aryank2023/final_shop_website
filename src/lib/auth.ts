import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "mv_admin_token";

function getJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;

  if (!value || new TextEncoder().encode(value).length < 32) {
    throw new Error("JWT_SECRET is missing or too weak. Configure a secret of at least 32 bytes.");
  }

  return new TextEncoder().encode(value);
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
  passwordChangeRequired?: boolean;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function signToken(payload: SessionPayload): Promise<string> {
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
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      passwordChangeRequired: payload.passwordChangeRequired === true,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the current admin using the Neon database as the source of truth.
 *
 * By default, admins who must change their password cannot access normal
 * admin APIs. The password-change endpoint may call getCurrentAdmin(true).
 */
export async function getCurrentAdmin(allowPasswordChange = false) {
  try {
    const cookieStore = cookies();
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

    if (admin.forcePasswordChange && !allowPasswordChange) {
      return null;
    }

    return {
      ...admin,
      username: admin.email,
    };
  } catch (error) {
    console.error("getCurrentAdmin error:", error);
    return null;
  }
}

export { COOKIE_NAME };
