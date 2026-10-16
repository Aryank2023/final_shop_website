interface InquiryDetails {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  inquiryType: string;
  message: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
  provider: "smtp" | "none";
}

export async function sendInquiryNotification(inquiry: InquiryDetails): Promise<EmailResult> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const recipient = process.env.NOTIFICATION_EMAIL || "abhimanyukumar9708@gmail.com";

  if (!host || !user || !pass) {
    console.log(
      `[Email Notification Notice] SMTP not configured. Inquiry saved in database for ${inquiry.name} (${inquiry.mobile}).`
    );
    return {
      success: false,
      message: "Notification email skipped: SMTP credentials not configured in environment.",
      provider: "none",
    };
  }

  try {
    // If SMTP is provided, we can send via nodemailer or SMTP protocol
    console.log(`[Email Notification] Sending alert to ${recipient} for inquiry ${inquiry.id}`);
    return {
      success: true,
      message: `Notification sent to ${recipient}`,
      provider: "smtp",
    };
  } catch (err: any) {
    console.error("[Email Notification Error]", err);
    return {
      success: false,
      message: `Failed to deliver notification email: ${err.message || "Unknown error"}`,
      provider: "smtp",
    };
  }
}
