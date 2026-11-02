// Email for the leaderboard. Sent through Resend the same way as the Printful "It's shipped" email
// (netlify/functions/printful-webhook.mjs): RESEND_API_KEY and the same 8s timeout. Emails to
// the team come from NOTIFICATION_FROM as before; `customer: true` ones (the parent's receipt)
// come from, and take replies at, the brand address (EMAIL_FROM / EMAIL_REPLY_TO, site-config). Throws on failure so the caller's request fails visibly.
import { setting } from '../functions/_shared/site-config.mjs';

const RESEND_URL = 'https://api.resend.com/emails';
const RESEND_TIMEOUT_MS = 8000;

export async function sendEmail({ to, subject, html, text, replyTo, customer = false }) {
  const key = process.env.RESEND_API_KEY;
  const from = customer ? setting('EMAIL_FROM') : (process.env.NOTIFICATION_FROM || setting('TEAM_EMAIL_FROM'));
  if (customer) replyTo = setting('EMAIL_REPLY_TO');
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ from, to, subject, html, text, reply_to: replyTo }),
    signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error('email failed: ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return res.json();
}
