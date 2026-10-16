import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getCurrentAdmin } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentAdmin = await getCurrentAdmin();

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-charcoal-900 flex flex-col md:flex-row">
      {/* If authenticated, show persistent sidebar navigation */}
      {currentAdmin && <AdminNav user={currentAdmin} />}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
