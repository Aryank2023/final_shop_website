const { PrismaClient } = require("@prisma/client-sqlite");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function exportSqliteData() {
  console.log("Exporting existing records from SQLite...");

  try {
    const data = {
      exportedAt: new Date().toISOString(),
      adminUsers: await prisma.adminUser.findMany(),
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany(),
      productImages: await prisma.productImage.findMany(),
      productVariants: await prisma.productVariant.findMany(),
      services: await prisma.service.findMany(),
      portfolioProjects: await prisma.portfolioProject.findMany(),
      portfolioImages: await prisma.portfolioImage.findMany(),
      inquiries: await prisma.inquiry.findMany(),
      siteSettings: await prisma.siteSettings.findMany(),
      adminAuditLogs: await prisma.adminAuditLog.findMany(),
    };

    const outputPath = path.join(process.cwd(), "prisma", "data-backup.json");
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");

    console.log("Successfully exported data to:", outputPath);
    console.log("Record summary:", {
      adminUsers: data.adminUsers.length,
      categories: data.categories.length,
      products: data.products.length,
      productImages: data.productImages.length,
      productVariants: data.productVariants.length,
      services: data.services.length,
      portfolioProjects: data.portfolioProjects.length,
      portfolioImages: data.portfolioImages.length,
      inquiries: data.inquiries.length,
      siteSettings: data.siteSettings.length,
      adminAuditLogs: data.adminAuditLogs.length,
    });
  } catch (error) {
    console.error("Export failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportSqliteData();


