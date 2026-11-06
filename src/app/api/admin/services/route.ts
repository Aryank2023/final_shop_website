import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithRole } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import {
  getClientIp,
  readBoundedJson,
  verifyCsrfOrigin,
  validateMediaUrl,
} from "@/lib/security";

export async function GET() {
  try {
    const { admin, error, status } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status });

    const [photoServices, cyberServices] = await Promise.all([
      prisma.photographyService.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.cyberCafeService.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    const formattedPhoto = photoServices.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      category: "Photography",
      description: s.description,
      imageUrl: s.heroImage,
      featuresJson: JSON.stringify(s.features || []),
      isFeatured: s.featured,
      status: s.status,
      type: "PHOTO",
    }));

    const formattedCyber = cyberServices.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      category: "Cyber Cafe & Digital",
      description: s.description,
      imageUrl: s.icon,
      startingPricePaise: s.priceFrom ? Math.round(Number(s.priceFrom) * 100) : null,
      isFeatured: false,
      status: s.status,
      type: "CYBER",
    }));

    return NextResponse.json({ services: [...formattedPhoto, ...formattedCyber] });
  } catch (error: any) {
    console.error("Get Services Error:", error);
    return NextResponse.json({ error: "Failed to retrieve services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const bodyResult = await readBoundedJson(req, 16384);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const { title, category, description, startingPricePaise, imageUrl, features, isFeatured } = bodyResult.data;

    if (typeof title !== "string" || !title.trim() || title.trim().length > 100) {
      return NextResponse.json({ error: "Service title is required and must be between 1 and 100 characters" }, { status: 400 });
    }

    if (category !== undefined && typeof category !== "string") {
      return NextResponse.json({ error: "Category must be a string" }, { status: 400 });
    }

    if (description !== undefined && typeof description !== "string") {
      return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
    }

    if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl === "string" && imageUrl.trim()) {
      if (!validateMediaUrl(imageUrl)) {
        return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
      }
    }

    // Reject string booleans
    if (isFeatured !== undefined && typeof isFeatured !== "boolean") {
      return NextResponse.json({ error: "isFeatured field must be a boolean" }, { status: 400 });
    }

    const baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let count = 1;

    const isCyber = category && typeof category === "string" && category.toLowerCase().includes("cyber");

    if (isCyber) {
      while (await prisma.cyberCafeService.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlug}-${count++}`;
      }

      let parsedPriceFrom: number | null = null;
      if (startingPricePaise !== undefined && startingPricePaise !== null && startingPricePaise !== "") {
        if (typeof startingPricePaise !== "number" || !Number.isInteger(startingPricePaise) || startingPricePaise < 0) {
          return NextResponse.json({ error: "Starting price must be a non-negative integer in paise" }, { status: 400 });
        }
        parsedPriceFrom = Math.round(startingPricePaise) / 100;
      }

      const service = await prisma.cyberCafeService.create({
        data: {
          title: title.trim(),
          slug: finalSlug,
          description: typeof description === "string" ? description.trim().slice(0, 1000) : "",
          icon: imageUrl && typeof imageUrl === "string" ? imageUrl.trim() : null,
          priceFrom: parsedPriceFrom,
        },
      });

      try {
        const ip = getClientIp(req);
        await prisma.auditLog.create({
          data: {
            adminId: admin.id,
            action: "CREATE_SERVICE",
            entity: "CyberCafeService",
            entityId: service.id,
            ipAddress: ip,
            metadata: { title: service.title },
          },
        });
      } catch (auditErr) {
        console.warn("Audit log notice:", auditErr);
      }

      return NextResponse.json({
        success: true,
        service: {
          id: service.id,
          title: service.title,
          slug: service.slug,
          category: "Cyber Cafe & Digital",
          description: service.description,
          imageUrl: service.icon,
          startingPricePaise: service.priceFrom ? Math.round(Number(service.priceFrom) * 100) : null,
        },
      }, { status: 201 });
    } else {
      while (await prisma.photographyService.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlug}-${count++}`;
      }

      const featureList: string[] = Array.isArray(features)
        ? features.filter((f) => typeof f === "string").map((f) => String(f).trim().slice(0, 100))
        : [];

      const service = await prisma.photographyService.create({
        data: {
          title: title.trim(),
          slug: finalSlug,
          description: typeof description === "string" ? description.trim().slice(0, 1000) : "",
          heroImage: imageUrl && typeof imageUrl === "string" ? imageUrl.trim() : null,
          features: featureList,
          featured: Boolean(isFeatured),
        },
      });

      try {
        const ip = getClientIp(req);
        await prisma.auditLog.create({
          data: {
            adminId: admin.id,
            action: "CREATE_SERVICE",
            entity: "PhotographyService",
            entityId: service.id,
            ipAddress: ip,
            metadata: { title: service.title },
          },
        });
      } catch (auditErr) {
        console.warn("Audit log notice:", auditErr);
      }

      return NextResponse.json({
        success: true,
        service: {
          id: service.id,
          title: service.title,
          slug: service.slug,
          category: category || "Photography",
          description: service.description,
          imageUrl: service.heroImage,
          featuresJson: JSON.stringify(service.features),
          isFeatured: service.featured,
        },
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Create Service Error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const bodyResult = await readBoundedJson(req, 16384);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const { id, title, category, description, startingPricePaise, imageUrl, features, isFeatured } = bodyResult.data;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    if (title !== undefined && (typeof title !== "string" || !title.trim() || title.trim().length > 100)) {
      return NextResponse.json({ error: "Title must be between 1 and 100 characters" }, { status: 400 });
    }

    if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl === "string" && imageUrl.trim()) {
      if (!validateMediaUrl(imageUrl)) {
        return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
      }
    }

    if (isFeatured !== undefined && typeof isFeatured !== "boolean") {
      return NextResponse.json({ error: "isFeatured field must be a boolean" }, { status: 400 });
    }

    const photoService = await prisma.photographyService.findUnique({ where: { id } });

    if (photoService) {
      const featureList: string[] | undefined = features !== undefined
        ? (Array.isArray(features) ? features.filter((f) => typeof f === "string").map((f) => String(f).trim().slice(0, 100)) : [])
        : undefined;

      const updated = await prisma.photographyService.update({
        where: { id },
        data: {
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description: typeof description === "string" ? description.trim().slice(0, 1000) : "" }),
          ...(imageUrl !== undefined && { heroImage: imageUrl && typeof imageUrl === "string" ? imageUrl.trim() : null }),
          ...(featureList !== undefined && { features: featureList }),
          ...(isFeatured !== undefined && { featured: Boolean(isFeatured) }),
        },
      });

      try {
        const ip = getClientIp(req);
        await prisma.auditLog.create({
          data: {
            adminId: admin.id,
            action: "UPDATE_SERVICE",
            entity: "PhotographyService",
            entityId: id,
            ipAddress: ip,
            metadata: { title: updated.title },
          },
        });
      } catch (auditErr) {
        console.warn("Audit log notice:", auditErr);
      }

      return NextResponse.json({
        success: true,
        service: {
          id: updated.id,
          title: updated.title,
          slug: updated.slug,
          category: category || "Photography",
          description: updated.description,
          imageUrl: updated.heroImage,
          featuresJson: JSON.stringify(updated.features),
          isFeatured: updated.featured,
        },
      });
    }

    const cyberService = await prisma.cyberCafeService.findUnique({ where: { id } });

    if (cyberService) {
      let parsedPriceFrom: number | null | undefined = undefined;
      if (startingPricePaise !== undefined) {
        if (startingPricePaise === null || startingPricePaise === "") {
          parsedPriceFrom = null;
        } else if (typeof startingPricePaise === "number" && Number.isInteger(startingPricePaise) && startingPricePaise >= 0) {
          parsedPriceFrom = Math.round(startingPricePaise) / 100;
        } else {
          return NextResponse.json({ error: "Starting price must be a non-negative integer in paise" }, { status: 400 });
        }
      }

      const updated = await prisma.cyberCafeService.update({
        where: { id },
        data: {
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description: typeof description === "string" ? description.trim().slice(0, 1000) : "" }),
          ...(imageUrl !== undefined && { icon: imageUrl && typeof imageUrl === "string" ? imageUrl.trim() : null }),
          ...(parsedPriceFrom !== undefined && { priceFrom: parsedPriceFrom }),
        },
      });

      try {
        const ip = getClientIp(req);
        await prisma.auditLog.create({
          data: {
            adminId: admin.id,
            action: "UPDATE_SERVICE",
            entity: "CyberCafeService",
            entityId: id,
            ipAddress: ip,
            metadata: { title: updated.title },
          },
        });
      } catch (auditErr) {
        console.warn("Audit log notice:", auditErr);
      }

      return NextResponse.json({
        success: true,
        service: {
          id: updated.id,
          title: updated.title,
          slug: updated.slug,
          category: "Cyber Cafe & Digital",
          description: updated.description,
          imageUrl: updated.icon,
          startingPricePaise: updated.priceFrom ? Math.round(Number(updated.priceFrom) * 100) : null,
        },
      });
    }

    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Update Service Error:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || typeof id !== "string") return NextResponse.json({ error: "ID required" }, { status: 400 });

    const photoService = await prisma.photographyService.findUnique({ where: { id } });
    if (photoService) {
      await prisma.photographyService.delete({ where: { id } });
      try {
        const ip = getClientIp(req);
        await prisma.auditLog.create({
          data: {
            adminId: admin.id,
            action: "DELETE_SERVICE",
            entity: "PhotographyService",
            entityId: id,
            ipAddress: ip,
          },
        });
      } catch (auditErr) {
        console.warn("Audit log notice:", auditErr);
      }
      return NextResponse.json({ success: true, message: "Service deleted" });
    }

    const cyberService = await prisma.cyberCafeService.findUnique({ where: { id } });
    if (cyberService) {
      await prisma.cyberCafeService.delete({ where: { id } });
      try {
        const ip = getClientIp(req);
        await prisma.auditLog.create({
          data: {
            adminId: admin.id,
            action: "DELETE_SERVICE",
            entity: "CyberCafeService",
            entityId: id,
            ipAddress: ip,
          },
        });
      } catch (auditErr) {
        console.warn("Audit log notice:", auditErr);
      }
      return NextResponse.json({ success: true, message: "Service deleted" });
    }

    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Delete Service Error:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
