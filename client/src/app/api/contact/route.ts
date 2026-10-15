
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";


type ContactBody = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const characters: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return characters[char] ?? char;
  });
}

function reply(
  message: string,
  status: number
) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return reply("Unsupported content type.", 415);
  }

  const configuredOrigin = process.env.SITE_URL?.replace(/\/$/, "");

  if (configuredOrigin) {
    const requestOrigin = request.headers.get("origin");

    if (requestOrigin !== configuredOrigin) {
      return reply("Request origin is not allowed.", 403);
    }
  }

  try {
    const raw = await request.text();

    if (raw.length > 12000) {
      return reply("Message is too large.", 413);
    }

    let body: ContactBody;

    try {
      body = JSON.parse(raw) as ContactBody;
    } catch {
      return reply("Invalid request.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return reply("Invalid request.", 400);
    }

    const name = clean(body.name);
    const email = clean(body.email);
    const subject = clean(body.subject);
    const message = clean(body.message);
    const website = clean(body.website);

    // Honeypot: normal visitors never fill this field.
    if (website) {
      return NextResponse.json({ success: true }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    if (
      name.length < 2 ||
      name.length > 100 ||
      !EMAIL_REGEX.test(email) ||
      email.length > 254 ||
      subject.length < 3 ||
      subject.length > 150 ||
      message.length < 10 ||
      message.length > 5000
    ) {
      return reply("Please check the submitted information.", 400);
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? "465");
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const destination = process.env.CONTACT_TO_EMAIL;

    if (
      !host ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      !user ||
      !password ||
      !destination
    ) {
      console.error("Contact email configuration is incomplete.");
      return reply("Email service is not configured.", 503);
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass: password,
      },
      connectionTimeout: 12000,
      greetingTimeout: 12000,
      socketTimeout: 15000,
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    await transporter.sendMail({
      from: {
        name: "CrestMark Academy Contact",
        address: process.env.SMTP_FROM_EMAIL || user,
      },
      to: destination,
      replyTo: {
        name,
        address: email,
      },
      subject: `CrestMark Academy | ${subject}`,
      text: [
        "New contact message",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        "",
        "Message:",
        message,
      ].join("\n"),
      html: `
        <div style="margin:0;padding:30px;background:#f5f8fc;font-family:Arial,sans-serif">
          <div style="max-width:620px;margin:auto;background:#fff;border:1px solid #dce7f1;border-radius:12px;overflow:hidden">
            <div style="padding:25px 30px;background:#102e54;color:#fff">
              <h1 style="font-size:21px;margin:0">CrestMark Academy</h1>
              <p style="margin:9px 0 0;color:#c2daee;font-size:13px">New contact message</p>
            </div>
            <div style="padding:30px;color:#163d62">
              <p><strong>Name:</strong> ${safeName}</p>
              <p><strong>Email:</strong> ${safeEmail}</p>
              <p><strong>Subject:</strong> ${safeSubject}</p>
              <hr style="border:0;border-top:1px solid #e0eaf2;margin:24px 0" />
              <p style="font-weight:bold">Message</p>
              <div style="line-height:1.9;overflow-wrap:anywhere">${safeMessage}</div>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "Contact delivery failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return reply(
      "We couldn't send your message. Please try again later.",
      502
    );
  }
}
