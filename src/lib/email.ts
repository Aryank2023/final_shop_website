export interface InquiryDetails {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  inquiryType: string;
  message: string;
  createdAt?: Date | string;
}

export interface EmailResult {
  success: boolean;
  message: string;
  provider: "BREVO" | "NONE";
  messageId?: string;
}

/**
 * Encodes special characters to HTML entities to prevent HTML injection / XSS in email clients.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface BrevoPayloadConfig {
  apiKey?: string;
  senderName?: string;
  senderEmail?: string;
  recipientEmail?: string;
}

/**
 * Builds the JSON payload for Brevo's POST /v3/smtp/email API.
 */
export function buildBrevoEmailPayload(
  inquiry: InquiryDetails,
  config?: BrevoPayloadConfig
) {
  const senderName =
    config?.senderName || process.env.BREVO_SENDER_NAME || "MAA VAISHNO VIDEO FILM'S";
  const senderEmail =
    config?.senderEmail || process.env.BREVO_SENDER_EMAIL || "maavaishnovideofilm@gmail.com";
  const recipientEmail =
    config?.recipientEmail || process.env.NOTIFICATION_EMAIL || "maavaishnovideofilm@gmail.com";

  const cleanPhone = inquiry.mobile.replace(/\D/g, "");
  const callUrl = `tel:+91${cleanPhone}`;
  const whatsappUrl = `https://wa.me/91${cleanPhone}`;

  const safeId = escapeHtml(inquiry.id);
  const safeName = escapeHtml(inquiry.name);
  const safeMobile = escapeHtml(inquiry.mobile);
  const safeEmail = inquiry.email ? escapeHtml(inquiry.email) : null;
  const safeInquiryType = escapeHtml(inquiry.inquiryType);
  const safeMessage = escapeHtml(inquiry.message);

  const formattedDate = inquiry.createdAt
    ? new Date(inquiry.createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " IST"
    : new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " IST";

  const subject = `New Customer Inquiry: ${inquiry.inquiryType} - ${inquiry.name} | MAA VAISHNO VIDEO FILM'S`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Customer Inquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">

          <!-- Studio Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #881337 0%, #4c0519 100%); padding: 32px 28px; text-align: center;">
              <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); color: #fecdd3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                Direct Customer Inquiry Alert
              </span>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                MAA VAISHNO VIDEO FILM'S
              </h1>
              <p style="margin: 6px 0 0 0; color: #fda4af; font-size: 13px;">
                Wedding Cinema &bull; Photography &bull; Sublimation Gifts
              </p>
            </td>
          </tr>

          <!-- Inquiry Body Card -->
          <tr>
            <td style="padding: 28px;">
              <div style="border-bottom: 2px solid #fecdd3; padding-bottom: 14px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #881337;">
                  New Inquiry Details
                </h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
                  Received on ${formattedDate} &bull; Reference ID: <span style="font-family: monospace; font-weight: 600;">${safeId}</span>
                </p>
              </div>

              <!-- Information Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="font-size: 14px; margin-bottom: 24px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td width="35%" style="color: #64748b; font-weight: 600; vertical-align: top; padding: 8px 0;">Customer Name</td>
                  <td width="65%" style="color: #0f172a; font-weight: 700; padding: 8px 0;">${safeName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="color: #64748b; font-weight: 600; vertical-align: top; padding: 8px 0;">Mobile Number</td>
                  <td style="padding: 8px 0;">
                    <a href="${callUrl}" style="color: #be123c; font-weight: 700; text-decoration: none; font-size: 15px;">
                      +91 ${safeMobile}
                    </a>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="color: #64748b; font-weight: 600; vertical-align: top; padding: 8px 0;">Email Address</td>
                  <td style="color: #0f172a; padding: 8px 0;">
                    ${
                      safeEmail
                        ? `<a href="mailto:${safeEmail}" style="color: #be123c; text-decoration: underline;">${safeEmail}</a>`
                        : '<span style="color: #94a3b8; font-style: italic;">Not provided</span>'
                    }
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="color: #64748b; font-weight: 600; vertical-align: top; padding: 8px 0;">Service / Product</td>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-block; background-color: #ffe4e6; color: #9f1239; font-weight: 700; font-size: 13px; padding: 4px 10px; border-radius: 6px;">
                      ${safeInquiryType}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Requirements Message Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #be123c; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px;">
                  Customer Requirements &amp; Message
                </span>
                <p style="margin: 0; font-size: 14px; color: #334155; white-space: pre-wrap; line-height: 1.6;">
${safeMessage}
                </p>
              </div>

              <!-- Quick Action Buttons -->
              <div style="text-align: center; margin: 24px 0 12px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                  <tr>
                    <td style="padding-right: 12px;">
                      <a href="${callUrl}" style="display: inline-block; background-color: #881337; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 22px; border-radius: 10px;">
                        &#128222; Call Customer
                      </a>
                    </td>
                    <td>
                      <a href="${whatsappUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 22px; border-radius: 10px;">
                        &#128172; Chat on WhatsApp
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Studio Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #475569;">
                MAA VAISHNO VIDEO FILM'S &bull; Proprietor: Abhimanyu Kumar
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
                Station Road, Hajipur, Vaishali, Bihar &bull; Contact: +91 9708345649
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #cbd5e1;">
                This transactional alert was automatically dispatched to notify you of a new website inquiry.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `=====================================================
NEW CUSTOMER INQUIRY - MAA VAISHNO VIDEO FILM'S
=====================================================
Reference ID: ${inquiry.id}
Received:     ${formattedDate}

Customer Name:   ${inquiry.name}
Mobile Number:   +91 ${inquiry.mobile}
Email:           ${inquiry.email || "Not provided"}
Inquiry Type:    ${inquiry.inquiryType}

Requirements & Message:
-----------------------------------------------------
${inquiry.message}
-----------------------------------------------------

Quick Actions:
- Call Customer:    ${callUrl}
- Chat on WhatsApp: ${whatsappUrl}

=====================================================
MAA VAISHNO VIDEO FILM'S
Proprietor: Abhimanyu Kumar | Phone: +91 9708345649
Station Road, Hajipur, Vaishali, Bihar
=====================================================`;

  const payload: Record<string, any> = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: recipientEmail,
        name: senderName,
      },
    ],
    subject,
    htmlContent,
    textContent,
  };

  if (inquiry.email && inquiry.email.trim() !== "") {
    payload.replyTo = {
      email: inquiry.email.trim(),
      name: inquiry.name.trim(),
    };
  }

  return payload;
}

/**
 * Sends a transactional email notification alert via Brevo REST API (POST https://api.brevo.com/v3/smtp/email).
 * If BREVO_API_KEY is not configured, safely logs a notice and skips dispatch without throwing.
 */
export async function sendInquiryNotification(inquiry: InquiryDetails): Promise<EmailResult> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.warn(
      `[Email Notification Notice] BREVO_API_KEY is not configured. Inquiry ${inquiry.id} saved in database; email alert skipped.`
    );
    return {
      success: false,
      message: "Brevo API key is not configured.",
      provider: "NONE",
    };
  }

  const payload = buildBrevoEmailPayload(inquiry);

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey.trim(),
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { messageId?: string };
      console.log(
        `[Email Notification] Inquiry ${inquiry.id} alert dispatched via Brevo successfully (MessageId: ${data.messageId || "ok"})`
      );
      return {
        success: true,
        message: "Email notification delivered successfully via Brevo.",
        provider: "BREVO",
        messageId: data.messageId,
      };
    }

    let errorDetail = "";
    try {
      const errJson = await res.json();
      errorDetail = errJson.message ? ` - ${errJson.message}` : "";
    } catch {
      // response body was not JSON
    }

    console.error(
      `[Email Notification Error] Brevo API rejected email dispatch: HTTP ${res.status} ${res.statusText}${errorDetail}`
    );

    return {
      success: false,
      message: `Brevo API error: HTTP ${res.status} ${res.statusText}`,
      provider: "BREVO",
    };
  } catch (err: any) {
    console.error(
      `[Email Notification Error] Network failure or timeout during email dispatch: ${err.message || "Unknown error"}`
    );
    return {
      success: false,
      message: err.message || "Network error during email dispatch",
      provider: "BREVO",
    };
  }
}
