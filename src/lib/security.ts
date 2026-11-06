import { NextRequest } from "next/server";
import net from "node:net";

/**
 * Global Security Utilities for MAA VAISHNO VIDEO FILM'S Admin Panel
 */

/**
 * Extracts and verifies the client IP address based on documented deployment platform behavior (Vercel).
 *
 * 1. Prioritizes trusted edge headers (x-real-ip, x-vercel-forwarded-for).
 * 2. If x-forwarded-for contains multiple proxy hops, extracts the leftmost client IP.
 * 3. Strictly validates that the candidate is a valid IPv4 or IPv6 address using node:net.
 * 4. Rejects spoofed or malicious non-IP strings and falls back safely to "127.0.0.1".
 */
export function getClientIp(req: NextRequest): string {
  // 1. Check x-real-ip (set and overwritten by Vercel edge proxy)
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp && net.isIP(realIp)) {
    return realIp;
  }

  // 2. Check x-vercel-forwarded-for (Vercel edge-specific forwarding header)
  const vercelForwarded = req.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelForwarded) {
    const firstIp = vercelForwarded.split(",")[0].trim();
    if (firstIp && net.isIP(firstIp)) {
      return firstIp;
    }
  }

  // 3. Check Next.js direct request IP if provided by runtime
  const directIp = (req as any).ip?.trim?.();
  if (directIp && net.isIP(directIp)) {
    return directIp;
  }

  // 4. Check standard x-forwarded-for (first proxy hop)
  const forwarded = req.headers.get("x-forwarded-for")?.trim();
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp && net.isIP(firstIp)) {
      return firstIp;
    }
  }

  // Safe fallback for local development or unresolvable headers
  return "127.0.0.1";
}

/**
 * Strict Cross-Site Request Forgery (CSRF) protection for cookie-authenticated mutation endpoints.
 *
 * Verifies that the request's Origin (or Referer if Origin is omitted by some clients)
 * matches the current Host header or the configured application URL.
 * Rejects cross-origin POST, PUT, DELETE, and PATCH requests.
 */
export function verifyCsrfOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  // Safe idempotent methods do not require CSRF origin validation
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const hostHeader = req.headers.get("host")?.trim()?.toLowerCase();
  const originHeader = req.headers.get("origin")?.trim();
  const refererHeader = req.headers.get("referer")?.trim();

  // If both Origin and Referer are absent on a browser mutation request, reject
  if (!originHeader && !refererHeader) {
    return false;
  }

  // Helper to extract hostname from URL string safely
  function getHostname(urlStr: string): string | null {
    try {
      const parsed = new URL(urlStr);
      return parsed.host.toLowerCase();
    } catch {
      return null;
    }
  }

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const configuredHost = configuredAppUrl ? getHostname(configuredAppUrl) : null;

  // 1. Verify Origin header if present
  if (originHeader) {
    const originHost = getHostname(originHeader);
    if (!originHost) return false;

    if (hostHeader && originHost === hostHeader) return true;
    if (configuredHost && originHost === configuredHost) return true;
    return false;
  }

  // 2. Fall back to Referer header if Origin was absent
  if (refererHeader) {
    const refererHost = getHostname(refererHeader);
    if (!refererHost) return false;

    if (hostHeader && refererHost === hostHeader) return true;
    if (configuredHost && refererHost === configuredHost) return true;
    return false;
  }

  return false;
}

/**
 * Safely reads and bounds the incoming request body stream to prevent memory exhaustion,
 * chunked transfer attacks, or missing Content-Length header bypasses.
 */
export async function readBoundedJson<T = any>(
  req: NextRequest,
  maxBytes = 4096
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  // 1. Fast reject if Content-Length header is present and exceeds maxBytes
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const parsedLength = parseInt(contentLengthHeader, 10);
    if (!isNaN(parsedLength) && parsedLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: `Payload too large. Request body cannot exceed ${maxBytes} bytes.`,
      };
    }
  }

  // 2. Safely read and bound incoming stream chunks
  if (!req.body) {
    return {
      ok: false,
      status: 400,
      error: "Request body cannot be empty",
    };
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          return {
            ok: false,
            status: 413,
            error: `Payload too large. Request body cannot exceed ${maxBytes} bytes.`,
          };
        }
        chunks.push(value);
      }
    }
  } catch (err) {
    return {
      ok: false,
      status: 400,
      error: "Error reading request stream",
    };
  }

  if (totalBytes === 0 || chunks.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Request body cannot be empty",
    };
  }

  const rawText = Buffer.concat(chunks).toString("utf8");
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Invalid or malformed JSON payload",
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      status: 400,
      error: "Request payload must be a valid JSON object",
    };
  }

  return { ok: true, data: parsed as T };
}

/**
 * Validates media URLs (images, icons) against an explicit security policy.
 *
 * Allowed:
 * 1. Safe relative paths starting with "/" (e.g. "/logo.png", "/uploads/...")
 * 2. HTTPS URLs from ImageKit or configured app domain
 *
 * Strictly Rejects:
 * - Dangerous schemes: javascript:, data:, file:, ftp:, blob:, http:
 * - Protocol-relative URLs starting with "//"
 */
export function validateMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;

  // Reject protocol-relative URLs
  if (trimmed.startsWith("//")) return false;

  // Allow relative site paths
  if (trimmed.startsWith("/")) {
    // Ensure no control characters or backslashes
    if (/[\x00-\x1f\x7f\\]/.test(trimmed)) return false;
    return true;
  }

  // For absolute URLs, require HTTPS
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;

    // Check trusted domains (ImageKit endpoint, localhost in dev, or user app domain)
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname.endsWith(".imagekit.io") ||
      hostname === "ik.imagekit.io" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return true;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const appHost = new URL(appUrl).hostname.toLowerCase();
      if (hostname === appHost) return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Validates external video embed URLs (YouTube, Vimeo) against strict allowlists.
 */
export function validateVideoEmbedUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    const allowedVideoHosts = [
      "www.youtube.com",
      "youtube.com",
      "youtu.be",
      "www.youtube-nocookie.com",
      "player.vimeo.com",
      "vimeo.com",
      "ik.imagekit.io",
    ];

    return allowedVideoHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Sanitizes open redirect parameters to guarantee redirection remains within the /admin console.
 * Strictly prevents open redirects, protocol-relative attacks (//evil.com), and script schemes.
 */
export function sanitizeAdminRedirect(
  target: string | null | undefined,
  fallback = "/admin/dashboard"
): string {
  if (!target || typeof target !== "string") return fallback;
  const trimmed = target.trim();

  // Must begin with /admin, must not begin with // or /\
  if (!trimmed.startsWith("/admin")) return fallback;
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return fallback;

  // Strict pattern: only /admin paths with valid path and query characters
  const safeAdminPathRegex = /^\/admin(\/[a-zA-Z0-9_\-\.\/]*)?(\?[a-zA-Z0-9_\-=&]*)?$/;
  if (!safeAdminPathRegex.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

