import React from "react";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";

export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentAdmin = await getCurrentAdmin();

  // Get active inquiry notification count if authenticated
  let newInquiriesCount = 0;
  if (currentAdmin) {
    try {
      newInquiriesCount = await prisma.inquiry.count({
        where: { status: "NEW" },
      });
    } catch {
      newInquiriesCount = 0;
    }
  }

  return (
    <div
      className={`min-h-screen ${
        currentAdmin
          ? "bg-[#fcfbf7] text-charcoal-900 flex flex-col md:flex-row"
          : "bg-[#06080d] text-white flex flex-col"
      }`}
    >
      {/* If authenticated, show persistent sidebar navigation */}
      {currentAdmin && <AdminNav user={currentAdmin} newInquiriesCount={newInquiriesCount} />}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
