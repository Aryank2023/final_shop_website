import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithRole } from "@/lib/auth";
import {
  getClientIp,
  readBoundedJson,
  verifyCsrfOrigin,
} from "@/lib/security";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateGoogleMapsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 1000) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    const allowedMapHosts = [
      "maps.google.com",
      "www.google.com",
      "google.com",
      "maps.app.goo.gl",
      "goo.gl",
    ];

    return allowedMapHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const { admin, error, status } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status });

    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "site-settings",
          businessName: "MAA VAISHNO VIDEO FILM'S",
          ownerName: "Abhimanyu Kumar",
          phone: "9708345649",
          email: "contact@maavaishnovideofilms.com",
          address: "Near Strawberry Kids School, Hathsarganj, Lalganj Road, Hajipur, Vaishali, Bihar - 844101",
          whatsappNumber: "9708345649",
          googleMapEmbed: "https://maps.app.goo.gl/PXY8owyi2jSiD1oc7",
        },
      });
    }

    return NextResponse.json({
      settings: {
        ...settings,
        proprietor: settings.ownerName,
        mapsUrl: settings.googleMapEmbed,
      },
    });
  } catch (error: any) {
    console.error("Get Settings Error:", error);
    return NextResponse.json({ error: "Failed to retrieve settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const bodyResult = await readBoundedJson(req, 8192);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const body = bodyResult.data;
    const existing = await prisma.settings.findFirst();
    const settingsId = existing ? existing.id : "site-settings";

    const updateData: any = {};

    if (body.businessName !== undefined) {
      if (typeof body.businessName !== "string" || !body.businessName.trim() || body.businessName.trim().length > 100) {
        return NextResponse.json({ error: "Business name must be between 1 and 100 characters" }, { status: 400 });
      }
      updateData.businessName = body.businessName.trim();
    }

    const rawOwner = body.ownerName !== undefined ? body.ownerName : body.proprietor;
    if (rawOwner !== undefined) {
      if (typeof rawOwner !== "string" || !rawOwner.trim() || rawOwner.trim().length > 100) {
        return NextResponse.json({ error: "Owner name must be between 1 and 100 characters" }, { status: 400 });
      }
      updateData.ownerName = rawOwner.trim();
    }

    if (body.phone !== undefined) {
      if (typeof body.phone !== "string" || !INDIAN_MOBILE_REGEX.test(body.phone.trim())) {
        return NextResponse.json({ error: "Phone number must be a valid 10-digit Indian mobile number" }, { status: 400 });
      }
      updateData.phone = body.phone.trim();
    }

    if (body.email !== undefined) {
      if (typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim()) || body.email.trim().length > 120) {
        return NextResponse.json({ error: "Email must be a valid email address" }, { status: 400 });
      }
      updateData.email = body.email.trim().toLowerCase();
    }

    if (body.address !== undefined) {
      if (typeof body.address !== "string" || body.address.trim().length > 255) {
        return NextResponse.json({ error: "Address must be a string up to 255 characters" }, { status: 400 });
      }
      updateData.address = body.address.trim();
    }

    if (body.whatsappNumber !== undefined) {
      if (typeof body.whatsappNumber !== "string" || !INDIAN_MOBILE_REGEX.test(body.whatsappNumber.trim())) {
        return NextResponse.json({ error: "WhatsApp number must be a valid 10-digit Indian mobile number" }, { status: 400 });
      }
      updateData.whatsappNumber = body.whatsappNumber.trim();
    } else if (body.phone !== undefined && !existing?.whatsappNumber) {
      updateData.whatsappNumber = updateData.phone;
    }

    const rawMaps = body.googleMapEmbed !== undefined ? body.googleMapEmbed : body.mapsUrl;
    if (rawMaps !== undefined) {
      if (rawMaps && typeof rawMaps === "string" && rawMaps.trim()) {
        if (!validateGoogleMapsUrl(rawMaps)) {
          return NextResponse.json({ error: "Invalid Google Maps URL. Must be a secure HTTPS Google Maps link." }, { status: 400 });
        }
        updateData.googleMapEmbed = rawMaps.trim();
      } else {
        updateData.googleMapEmbed = null;
      }
    }

    if (body.socialLinks !== undefined) {
      if (body.socialLinks !== null && typeof body.socialLinks !== "object") {
        return NextResponse.json({ error: "socialLinks must be a valid JSON object or null" }, { status: 400 });
      }
      updateData.socialLinks = body.socialLinks;
    }

    const settings = await prisma.settings.upsert({
      where: { id: settingsId },
      update: updateData,
      create: {
        id: settingsId,
        businessName: updateData.businessName || "MAA VAISHNO VIDEO FILM'S",
        ownerName: updateData.ownerName || "Abhimanyu Kumar",
        phone: updateData.phone || "9708345649",
        email: updateData.email || "contact@maavaishnovideofilms.com",
        address: updateData.address || "Hajipur, Bihar",
        whatsappNumber: updateData.whatsappNumber || "9708345649",
        googleMapEmbed: updateData.googleMapEmbed || null,
        socialLinks: updateData.socialLinks || null,
      },
    });

    try {
      const ip = getClientIp(req);
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "UPDATE_SETTINGS",
          entity: "Settings",
          entityId: settings.id,
          ipAddress: ip,
          metadata: { businessName: settings.businessName },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        proprietor: settings.ownerName,
        mapsUrl: settings.googleMapEmbed,
      },
    });
  } catch (error: any) {
    console.error("Update Settings Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
