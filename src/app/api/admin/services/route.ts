import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const services = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, category, description, startingPricePaise, imageUrl, features } = body;

    const slug = slugify(title);
    const service = await prisma.service.create({
      data: {
        title,
        slug,
        category: category || "Photography",
        description,
        startingPricePaise: startingPricePaise ? Number(startingPricePaise) : null,
        imageUrl: imageUrl || null,
        featuresJson: features ? JSON.stringify(features) : null,
      },
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, title, category, description, startingPricePaise, imageUrl, features, isFeatured } =
      body;

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(category && { category }),
        ...(description && { description }),
        ...(startingPricePaise !== undefined && {
          startingPricePaise: startingPricePaise ? Number(startingPricePaise) : null,
        }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(features && { featuresJson: JSON.stringify(features) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Service deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
