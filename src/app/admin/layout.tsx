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
      newInquiriesCount = await prisma.contactMessage.count({
        where: { read: false },
      });
    } catch {
      newInquiriesCount = 0;
    }
  }

  // Construct an explicit safe user object containing only the required public fields
  const safeUser = currentAdmin
    ? {
        id: currentAdmin.id,
        username: currentAdmin.username,
        name: currentAdmin.name,
        role: currentAdmin.role,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-charcoal-900 flex flex-col md:flex-row">
      {/* If authenticated, show persistent sidebar navigation with safe user props only */}
      {safeUser && <AdminNav user={safeUser} newInquiriesCount={newInquiriesCount} />}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
