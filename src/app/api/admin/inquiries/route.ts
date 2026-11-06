import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const query = searchParams.get("q");

    // Bounded pagination: page min 1, limit 1..100 (default 20)
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = !isNaN(rawLimit) && rawLimit >= 1 ? Math.min(100, rawLimit) : 20;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (statusParam === "NEW") {
      where.read = false;
    } else if (statusParam === "CONTACTED" || statusParam === "RESOLVED") {
      where.read = true;
    }

    if (query && typeof query === "string" && query.trim()) {
      const sanitizedQuery = query.trim().slice(0, 100);
      where.OR = [
        { name: { contains: sanitizedQuery, mode: "insensitive" } },
        { phone: { contains: sanitizedQuery, mode: "insensitive" } },
        { message: { contains: sanitizedQuery, mode: "insensitive" } },
        { subject: { contains: sanitizedQuery, mode: "insensitive" } },
      ];
    }

    const [messages, filteredTotal, allCount, newCount, contactedCount] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { read: false } }),
      prisma.contactMessage.count({ where: { read: true } }),
    ]);

    const inquiries = messages.map((m) => ({
      id: m.id,
      name: m.name,
      mobile: m.phone,
      email: m.email,
      inquiryType: m.subject || "General",
      subject: m.subject,
      message: m.message,
      status: m.read ? "CONTACTED" : "NEW",
      createdAt: m.createdAt.toISOString(),
    }));

    const counts = {
      all: allCount,
      new: newCount,
      contacted: contactedCount,
      resolved: 0,
    };

    return NextResponse.json({
      inquiries,
      counts,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Get Inquiries Error:", error);
    return NextResponse.json({ error: "Failed to retrieve inquiries" }, { status: 500 });
  }
}
