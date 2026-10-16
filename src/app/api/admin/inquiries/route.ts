import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = searchParams.get("q");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { mobile: { contains: query } },
        { message: { contains: query } },
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const counts = {
      all: await prisma.inquiry.count(),
      new: await prisma.inquiry.count({ where: { status: "NEW" } }),
      contacted: await prisma.inquiry.count({ where: { status: "CONTACTED" } }),
      resolved: await prisma.inquiry.count({ where: { status: "RESOLVED" } }),
    };

    return NextResponse.json({ inquiries, counts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
