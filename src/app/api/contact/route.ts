import nodemailer from "nodemailer";
import { personal } from "@/data/portfolio";

export const runtime = "nodejs";

// A small per-process backstop. Configure shared rate limiting at the hosting
// edge when deploying across multiple instances.
const attempts = new Map<string, { count: number; expires: number }>();
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return fail("Request not allowed.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return fail("Expected a JSON message.", 415);
  if (Number(request.headers.get("content-length")) > 24000) return fail("Your message is too large.", 413);

  let data: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail("Please complete the form.", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 24000) { await reader.cancel(); return fail("Your message is too large.", 413); }
      chunks.push(value);
    }
    data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) return fail("Invalid message.", 400);
  } catch { return fail("Invalid message.", 400); }

  if (data.website) return fail("Unable to submit this message.", 400);
  const field = (key: string) => typeof data[key] === "string" ? data[key].trim() : "";
  const name = field("name"), email = field("email"), subject = field("subject"), message = field("message");
  if (name.length < 2 || name.length > 80 || /[\r\n]/.test(name) ||
      email.length > 254 || !emailPattern.test(email) ||
      subject.length < 3 || subject.length > 120 || /[\r\n]/.test(subject) ||
      message.length < 10 || message.length > 5000) {
    return fail("Please enter a valid name, email, subject, and a message of 10–5,000 characters.", 400);
  }

  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) return fail("The contact form is temporarily unavailable. Please use the email link instead.", 503);

  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  // Email and global limits avoid trusting client-supplied forwarding headers.
  const keys = ["global", `email:${email.toLowerCase()}`];
  if (keys.some((key) => (attempts.get(key)?.count ?? 0) >= (key === "global" ? 20 : 3))) {
    return fail("Too many messages. Please try again in 15 minutes.", 429);
  }
  for (const key of keys) {
    const entry = attempts.get(key) ?? { count: 0, expires: now + 15 * 60 * 1000 };
    entry.count++;
    attempts.set(key, entry);
  }

  const transporter = nodemailer.createTransport({
    service: "gmail", auth: { user, pass },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  try {
    const result = await transporter.sendMail({
      from: { name: "Eric Va Portfolio", address: user },
      to: personal.email,
      replyTo: { name, address: email },
      subject: `[Portfolio] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
    if (!result.accepted.length) throw new Error("Message not accepted");
    return Response.json({ ok: true });
  } catch {
    return fail("Your message could not be sent. Please try again later or email me directly.", 502);
  } finally { transporter.close(); }
}
