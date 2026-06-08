// netlify/functions/subscribe.mts  (Labrats)
// Server-side MailerLite proxy for the merch waitlist form. Exists so the
// MailerLite API key lives in an env var instead of being hardcoded in the
// client bundle (it was previously exposed in page source — rotate that key).
// netlify.toml already maps /api/* -> /.netlify/functions/*, so the form
// posts to /api/subscribe.
// Env required: MAILERLITE_API_KEY  (Netlify site env)

import type { Context } from "@netlify/functions";

const GROUP_FALLBACK = "184360862869358023"; // labrats waitlist group

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) {
    console.error("[subscribe] MAILERLITE_API_KEY not set");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }

  let body: { email?: string; groups?: string[]; fields?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      email,
      groups: body.groups?.length ? body.groups : [GROUP_FALLBACK],
      fields: body.fields ?? { source: "labrats-merch-waitlist" },
    }),
  });

  // Pass MailerLite's status through (422 = already subscribed; the form
  // handles it as a friendly state).
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
