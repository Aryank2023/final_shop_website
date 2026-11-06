import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getImageKitAuthParams, isImageKitConfigured } from "@/lib/storage/imagekit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (admin.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    if (!isImageKitConfigured()) {
      return NextResponse.json(
        {
          error: "ImageKit storage service is not configured.",
        },
        { status: 503 }
      );
    }

    const authParams = getImageKitAuthParams();
    return NextResponse.json(authParams);
  } catch (error: any) {
    console.error("ImageKit auth error:", error);
    return NextResponse.json(
      { error: "Failed to generate storage authorization parameters" },
      { status: 500 }
    );
  }
}
