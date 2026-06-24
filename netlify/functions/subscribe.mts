// netlify/functions/subscribe.mts  (Labrats)
//
// Server-side MailerLite proxy. The newsletter form POSTs { email } to
// /api/subscribe (netlify.toml rewrites /api/*  ->  /.netlify/functions/*),
// so the MailerLite API token lives in an env var and never reaches the
// browser.
//
// Env vars (set in Netlify; mark MAILERLITE_API_KEY as "Secret"):
//   MAILERLITE_API_KEY   - MailerLite API token (use the ROTATED token)
//   MAILERLITE_GROUP_ID  - Labrats newsletter group (default below)
//
// Response contract (consumed by src/components/Newsletter.astro):
//   200 { ok: true }                -> newly subscribed
//   200 { ok: true, already: true } -> already on the list
//   400 | 500 | 502 { error }

import type { Context } from "@netlify/functions";

const GROUP_ID = process.env.MAILERLITE_GROUP_ID || "184360862869358023";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const key = process.env.MAILERLITE_API_KEY;
  if (!key) {
    console.error("[subscribe] MAILERLITE_API_KEY not set");
    return json(500, { error: "Newsletter not configured" });
  }

  let email: string;
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return json(400, { error: "Invalid request" });
  }
  if (!EMAIL_RE.test(email)) {
    return json(400, { error: "Please enter a valid email address" });
  }

  const payload: Record<string, unknown> = {
    email,
    status: "active",
    fields: { source: "labrats-newsletter" },
  };
  if (GROUP_ID) payload.groups = [GROUP_ID];

  try {
    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) return json(200, { ok: true });
    // 422 = validation / already-handled address -> friendly "already in" state
    if (res.status === 422) return json(200, { ok: true, already: true });

    console.error("[subscribe] MailerLite error", res.status, await res.text());
    return json(502, { error: "Could not sign you up right now. Please try again later." });
  } catch (err) {
    console.error("[subscribe] request failed", err);
    return json(502, { error: "Could not sign you up right now. Please try again later." });
  }
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
