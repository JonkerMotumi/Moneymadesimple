// Cloudflare Pages Function: POST /api/subscribe
// Adds the visitor to MailerLite and sets the "unlocked" cookie.
// Secrets (set in the Cloudflare dashboard, never in code):
//   MAILERLITE_API_KEY, MAILERLITE_GROUP_ID
// Local dev only: ALLOW_MOCK=1 skips the MailerLite call.

const COOKIE = 'mms_access';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }

  // Honeypot: real people never fill this hidden field. Pretend success to bots.
  if (data.company) return json({ ok: true });

  const email = String(data.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }
  // Explicit, un-pre-ticked consent is required (GDPR / POPIA).
  if (data.consent !== true) {
    return json({ ok: false, error: 'Please tick the box to agree to receive emails.' }, 400);
  }

  const source = String(data.source || '/').slice(0, 200);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  if (!env.MAILERLITE_API_KEY || !env.MAILERLITE_GROUP_ID) {
    if (env.ALLOW_MOCK !== '1') {
      console.error('MAILERLITE_API_KEY / MAILERLITE_GROUP_ID not set');
      return json({ ok: false, error: 'Signup is temporarily unavailable. Please try again later.' }, 503);
    }
  } else {
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.MAILERLITE_API_KEY}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        groups: [env.MAILERLITE_GROUP_ID],
        // Proof of consent: when, from where, and the page they signed up on.
        opted_in_at: now,
        optin_ip: request.headers.get('cf-connecting-ip') || undefined,
        fields: { source_page: source },
      }),
    });
    // 200 = updated existing subscriber, 201 = created. Anything else is a real failure.
    if (res.status !== 200 && res.status !== 201) {
      console.error('MailerLite error', res.status, await res.text());
      return json({ ok: false, error: 'We could not complete your signup. Please try again.' }, 502);
    }
  }

  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return json({ ok: true }, 200, {
    'set-cookie': `${COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax${secure}`,
  });
}

export const onRequest = () => json({ ok: false, error: 'Method not allowed.' }, 405, { allow: 'POST' });
