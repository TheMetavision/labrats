// Email for the leaderboard. Sent through Resend the same way as the Printful "It's shipped" email
// (netlify/functions/printful-webhook.mjs): RESEND_API_KEY, sender NOTIFICATION_FROM with the
// same default, and the same 8s timeout. Throws on failure so the caller's request fails visibly.
const RESEND_URL = 'https://api.resend.com/emails';
const RESEND_TIMEOUT_MS = 8000;

export async function sendEmail({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM || 'Labrats <orders@labrats.uk>';
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ from, to, subject, html, text, reply_to: replyTo }),
    signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error('email failed: ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return res.json();
}
