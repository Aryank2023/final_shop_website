import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithRole } from "@/lib/auth";
import { readBoundedJson, verifyCsrfOrigin } from "@/lib/security";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid inquiry ID" }, { status: 400 });
    }

    const bodyResult = await readBoundedJson(req, 4096);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const { status, read } = bodyResult.data;

    // Reject string booleans
    if (read !== undefined && typeof read !== "boolean") {
      return NextResponse.json({ error: "read field must be a boolean" }, { status: 400 });
    }

    const isRead = read !== undefined ? read : (status === "CONTACTED" || status === "RESOLVED");

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        read: isRead,
      },
    });

    const inquiry = {
      id: updated.id,
      name: updated.name,
      mobile: updated.phone,
      email: updated.email,
      inquiryType: updated.subject || "General",
      subject: updated.subject,
      message: updated.message,
      status: updated.read ? "CONTACTED" : "NEW",
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, inquiry });
  } catch (error: any) {
    console.error("Update Inquiry Error:", error);
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid inquiry ID" }, { status: 400 });
    }

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    await prisma.contactMessage.delete({ where: { id } });

    try {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "DELETE_CONTACT_MESSAGE",
          entity: "ContactMessage",
          entityId: id,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({ success: true, message: "Inquiry deleted" });
  } catch (error: any) {
    console.error("Delete Inquiry Error:", error);
    return NextResponse.json({ error: "Failed to delete inquiry" }, { status: 500 });
  }
}
