const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function importToPostgres() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
    console.error("ERROR: DATABASE_URL is not set to a PostgreSQL / Neon connection string.");
    console.error("Current DATABASE_URL:", dbUrl ? dbUrl.substring(0, 15) + "..." : "(empty)");
    console.error("Please set your Neon DATABASE_URL in .env before running this migration.");
    process.exit(1);
  }

  const backupFilePath = path.join(process.cwd(), "prisma", "data-backup.json");
  if (!fs.existsSync(backupFilePath)) {
    console.error("ERROR: Exported SQLite backup file not found at:", backupFilePath);
    console.error("Run `node scripts/export-sqlite.js` first.");
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFilePath, "utf8"));
  const prisma = new PrismaClient();

  console.log("Connecting to Neon PostgreSQL database...");
  console.log(`Starting import from backup created at: ${backupData.exportedAt}`);

  try {
    // 1. SiteSettings
    console.log(`Importing ${backupData.siteSettings.length} SiteSettings records...`);
    for (const item of backupData.siteSettings) {
      await prisma.siteSettings.upsert({
        where: { id: item.id },
        update: { ...item },
        create: { ...item },
      });
    }

    // 2. AdminUsers
    console.log(`Importing ${backupData.adminUsers.length} AdminUser records...`);
    for (const item of backupData.adminUsers) {
      await prisma.adminUser.upsert({
        where: { id: item.id },
        update: {
          username: item.username,
          email: item.email,
          passwordHash: item.passwordHash,
          name: item.name,
          role: item.role,
          isActive: item.isActive,
          lastLoginAt: item.lastLoginAt ? new Date(item.lastLoginAt) : null,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          username: item.username,
          email: item.email,
          passwordHash: item.passwordHash,
          name: item.name,
          role: item.role,
          isActive: item.isActive,
          lastLoginAt: item.lastLoginAt ? new Date(item.lastLoginAt) : null,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 3. Categories
    console.log(`Importing ${backupData.categories.length} Category records...`);
    for (const item of backupData.categories) {
      await prisma.category.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          icon: item.icon,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          icon: item.icon,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 4. Products
    console.log(`Importing ${backupData.products.length} Product records...`);
    for (const item of backupData.products) {
      await prisma.product.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          details: item.details,
          pricePaise: item.pricePaise,
          mrpPaise: item.mrpPaise,
          discountPercent: item.discountPercent,
          isAvailable: item.isAvailable,
          isFeatured: item.isFeatured,
          isPublished: item.isPublished,
          categoryId: item.categoryId,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          details: item.details,
          pricePaise: item.pricePaise,
          mrpPaise: item.mrpPaise,
          discountPercent: item.discountPercent,
          isAvailable: item.isAvailable,
          isFeatured: item.isFeatured,
          isPublished: item.isPublished,
          categoryId: item.categoryId,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 5. ProductImages
    console.log(`Importing ${backupData.productImages.length} ProductImage records...`);
    for (const item of backupData.productImages) {
      await prisma.productImage.upsert({
        where: { id: item.id },
        update: {
          productId: item.productId,
          url: item.url,
          key: item.key || null,
          altText: item.altText,
          isPrimary: item.isPrimary,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
        },
        create: {
          id: item.id,
          productId: item.productId,
          url: item.url,
          key: item.key || null,
          altText: item.altText,
          isPrimary: item.isPrimary,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 6. ProductVariants
    console.log(`Importing ${backupData.productVariants.length} ProductVariant records...`);
    for (const item of backupData.productVariants) {
      await prisma.productVariant.upsert({
        where: { id: item.id },
        update: {
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          priceDeltaPaise: item.priceDeltaPaise,
          stock: item.stock,
          attributesJson: item.attributesJson,
          createdAt: new Date(item.createdAt),
        },
        create: {
          id: item.id,
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          priceDeltaPaise: item.priceDeltaPaise,
          stock: item.stock,
          attributesJson: item.attributesJson,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 7. Services
    console.log(`Importing ${backupData.services.length} Service records...`);
    for (const item of backupData.services) {
      await prisma.service.upsert({
        where: { id: item.id },
        update: {
          title: item.title,
          slug: item.slug,
          category: item.category,
          description: item.description,
          startingPricePaise: item.startingPricePaise,
          imageUrl: item.imageUrl,
          featuresJson: item.featuresJson,
          isFeatured: item.isFeatured,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          title: item.title,
          slug: item.slug,
          category: item.category,
          description: item.description,
          startingPricePaise: item.startingPricePaise,
          imageUrl: item.imageUrl,
          featuresJson: item.featuresJson,
          isFeatured: item.isFeatured,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 8. PortfolioProjects
    console.log(`Importing ${backupData.portfolioProjects.length} PortfolioProject records...`);
    for (const item of backupData.portfolioProjects) {
      await prisma.portfolioProject.upsert({
        where: { id: item.id },
        update: {
          title: item.title,
          slug: item.slug,
          category: item.category,
          description: item.description,
          clientName: item.clientName,
          eventDate: item.eventDate ? new Date(item.eventDate) : null,
          videoUrl: item.videoUrl,
          videoKey: item.videoKey || null,
          isFeatured: item.isFeatured,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          title: item.title,
          slug: item.slug,
          category: item.category,
          description: item.description,
          clientName: item.clientName,
          eventDate: item.eventDate ? new Date(item.eventDate) : null,
          videoUrl: item.videoUrl,
          videoKey: item.videoKey || null,
          isFeatured: item.isFeatured,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 9. PortfolioImages
    console.log(`Importing ${backupData.portfolioImages.length} PortfolioImage records...`);
    for (const item of backupData.portfolioImages) {
      await prisma.portfolioImage.upsert({
        where: { id: item.id },
        update: {
          projectId: item.projectId,
          url: item.url,
          key: item.key || null,
          caption: item.caption,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
        },
        create: {
          id: item.id,
          projectId: item.projectId,
          url: item.url,
          key: item.key || null,
          caption: item.caption,
          sortOrder: item.sortOrder,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 10. Inquiries
    console.log(`Importing ${backupData.inquiries.length} Inquiry records...`);
    for (const item of backupData.inquiries) {
      await prisma.inquiry.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          email: item.email,
          mobile: item.mobile,
          inquiryType: item.inquiryType,
          subject: item.subject,
          message: item.message,
          status: item.status,
          internalNotes: item.internalNotes,
          ipAddress: item.ipAddress,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          name: item.name,
          email: item.email,
          mobile: item.mobile,
          inquiryType: item.inquiryType,
          subject: item.subject,
          message: item.message,
          status: item.status,
          internalNotes: item.internalNotes,
          ipAddress: item.ipAddress,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 11. AdminAuditLogs
    console.log(`Importing ${backupData.adminAuditLogs.length} AdminAuditLog records...`);
    for (const item of backupData.adminAuditLogs) {
      await prisma.adminAuditLog.upsert({
        where: { id: item.id },
        update: {
          adminUserId: item.adminUserId,
          action: item.action,
          entityType: item.entityType,
          entityId: item.entityId,
          detailsJson: item.detailsJson,
          ipAddress: item.ipAddress,
          createdAt: new Date(item.createdAt),
        },
        create: {
          id: item.id,
          adminUserId: item.adminUserId,
          action: item.action,
          entityType: item.entityType,
          entityId: item.entityId,
          detailsJson: item.detailsJson,
          ipAddress: item.ipAddress,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // Verification
    console.log("\n--- Verification: Checking PostgreSQL Record Counts ---");
    const counts = {
      adminUsers: await prisma.adminUser.count(),
      categories: await prisma.category.count(),
      products: await prisma.product.count(),
      productImages: await prisma.productImage.count(),
      productVariants: await prisma.productVariant.count(),
      services: await prisma.service.count(),
      portfolioProjects: await prisma.portfolioProject.count(),
      portfolioImages: await prisma.portfolioImage.count(),
      inquiries: await prisma.inquiry.count(),
      siteSettings: await prisma.siteSettings.count(),
      adminAuditLogs: await prisma.adminAuditLog.count(),
    };

    console.log("PostgreSQL Counts:", JSON.stringify(counts, null, 2));

    const matches =
      counts.adminUsers === backupData.adminUsers.length &&
      counts.categories === backupData.categories.length &&
      counts.products === backupData.products.length &&
      counts.productImages === backupData.productImages.length &&
      counts.productVariants === backupData.productVariants.length &&
      counts.services === backupData.services.length &&
      counts.portfolioProjects === backupData.portfolioProjects.length &&
      counts.portfolioImages === backupData.portfolioImages.length &&
      counts.inquiries === backupData.inquiries.length &&
      counts.siteSettings === backupData.siteSettings.length &&
      counts.adminAuditLogs === backupData.adminAuditLogs.length;

    if (matches) {
      console.log("\nSUCCESS: All record counts match 100%! Data migration is complete and verified.");
    } else {
      console.warn("\nWARNING: Some counts differ. Please inspect above output.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importToPostgres();
