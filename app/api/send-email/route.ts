import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const CANDIDATE_NAME = process.env.CANDIDATE_NAME || "Job Applicant";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { error: "Gmail credentials are not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to your .env file." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    // Accept comma-separated list of recipients
    const toRaw = (formData.get("to") as string) || "";
    const subject = (formData.get("subject") as string) || "";
    const emailBody = (formData.get("emailBody") as string) || "";
    const resumeFile = formData.get("resume") as File | null;

    if (!toRaw || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Recipient email(s), subject, and body are required." },
        { status: 400 }
      );
    }

    // Parse and validate all recipients
    const recipients = toRaw
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const invalid = recipients.filter((e) => !emailRegex.test(e));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid email address(es): ${invalid.join(", ")}` },
        { status: 400 }
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient email is required." },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    await transporter.verify();

    // Build resume attachment once, reuse for all sends
    const attachments: nodemailer.SendMailOptions["attachments"] = [];
    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      attachments.push({
        filename: resumeFile.name,
        content: buffer,
        contentType: resumeFile.type || "application/octet-stream",
      });
    }

    const htmlBody = emailBody
      .split("\n")
      .map((line: string) => `<p style="margin:0 0 8px 0">${line || "&nbsp;"}</p>`)
      .join("");

    // Send to each recipient individually (not CC/BCC) so each gets a personal email
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: `${CANDIDATE_NAME} <${GMAIL_USER}>`,
          to: recipient,
          subject,
          text: emailBody,
          html: htmlBody,
          attachments,
        });
        results.push({ email: recipient, success: true });
      } catch (err) {
        results.push({
          email: recipient,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: successCount > 0,
      successCount,
      failCount,
      results,
      attached: attachments.length > 0,
    });
  } catch (error) {
    console.error("[POST /api/send-email]", error);

    let message = "Failed to send email. Please try again.";
    if (error instanceof Error) {
      if (error.message.includes("Invalid login") || error.message.includes("Username and Password")) {
        message = "Gmail authentication failed. Check your App Password and ensure 2-Step Verification is enabled.";
      } else if (error.message.includes("ECONNREFUSED") || error.message.includes("ETIMEDOUT")) {
        message = "Could not connect to Gmail SMTP. Check your internet connection.";
      } else {
        message = process.env.NODE_ENV === "development"
          ? `Email error: ${error.message}`
          : "Failed to send email. Please try again.";
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
