const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function check() {
  try {
    const counts = {
      admins: await p.adminUser.count(),
      categories: await p.category.count(),
      products: await p.product.count(),
      productImages: await p.productImage.count(),
      productVariants: await p.productVariant.count(),
      services: await p.service.count(),
      portfolioProjects: await p.portfolioProject.count(),
      portfolioImages: await p.portfolioImage.count(),
      inquiries: await p.inquiry.count(),
      siteSettings: await p.siteSettings.count(),
      auditLogs: await p.adminAuditLog.count(),
    };
    console.log("Current SQLite database counts:", JSON.stringify(counts, null, 2));
  } catch (err) {
    console.error("Error inspecting DB:", err);
  } finally {
    await p.$disconnect();
  }
}

check();

