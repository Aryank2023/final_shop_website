import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendInquiryNotification } from "@/lib/email";

// Simple in-memory rate limiter per IP: max 5 requests per 10 minutes
const ipRequestCounts = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipRequestCounts.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 6) {
    return false;
  }
  entry.count += 1;
  return true;
}

const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  inquiryType: z.string().min(1, "Please select an inquiry type"),
  subject: z.string().optional(),
  message: z.string().min(5, "Message must be at least 5 characters").max(1000),
  honeypot: z.string().max(0, "Spam detected").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes before submitting again." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Check honeypot for bot spam
    if (body.website || body.honeypot) {
      return NextResponse.json({ success: true, message: "Inquiry received" }, { status: 200 });
    }

    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, mobile, email, inquiryType, subject, message } = parsed.data;

    // Save in database
    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        mobile,
        email: email || null,
        inquiryType,
        subject: subject || `${inquiryType} Inquiry`,
        message,
        status: "NEW",
        ipAddress: ip,
      },
    });

    // Dispatch email alert if provider is configured
    const emailResult = await sendInquiryNotification({
      id: inquiry.id,
      name: inquiry.name,
      mobile: inquiry.mobile,
      email: inquiry.email,
      inquiryType: inquiry.inquiryType,
      message: inquiry.message,
    });

    return NextResponse.json(
      {
        success: true,
        inquiryId: inquiry.id,
        message: "Thank you! Your inquiry has been sent to Abhimanyu Kumar. We will call you shortly.",
        emailStatus: emailResult.message,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Inquiry API Error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please call us directly at 9708345649." },
      { status: 500 }
    );
  }
}
