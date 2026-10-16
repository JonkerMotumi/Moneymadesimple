import { SITE } from '../config';

const KEY = 'mms_access';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
// Preview builds (e.g. GitHub Pages) have no email backend: pretend the signup worked.
const PREVIEW = import.meta.env.PUBLIC_PREVIEW === '1';
const root = document.documentElement;

export const isUnlocked = (): boolean => {
  if (new RegExp(`(?:^|; )${KEY}=1`).test(document.cookie)) return true;
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};

function markUnlocked() {
  try { localStorage.setItem(KEY, '1'); } catch {}
  document.cookie = `${KEY}=1; Path=/; Max-Age=31536000; SameSite=Lax`;
  root.classList.add('just-unlocked', 'is-unlocked');
  window.dispatchEvent(new CustomEvent('mms:unlocked'));
}

// ---- Theme toggle ----
document.querySelectorAll('[data-theme-toggle]').forEach((b) =>
  b.addEventListener('click', () => {
    const dark = getComputedStyle(root).colorScheme === 'dark';
    const next = dark ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('mms-theme', next); } catch {}
  }),
);

// ---- Signup forms (hero, calculators, blog) ----
document.querySelectorAll<HTMLFormElement>('[data-signup-form]').forEach((form) => {
  const msg = form.querySelector<HTMLElement>('.msg')!;
  const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    const consent = fd.get('consent') === 'on';
    msg.className = 'msg';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      msg.textContent = 'Please enter a valid email address.'; msg.classList.add('err');
      form.querySelector<HTMLInputElement>('input[type=email]')!.focus(); return;
    }
    if (!consent) {
      msg.textContent = 'Please tick the box so we can email you the guide.'; msg.classList.add('err'); return;
    }
    btn.disabled = true; msg.textContent = 'Unlocking…';
    try {
      if (PREVIEW) await new Promise((r) => setTimeout(r, 500));
      const res = PREVIEW ? new Response(JSON.stringify({ ok: true })) : await fetch(`${BASE}/api/subscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, consent, company: fd.get('company'), source: location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      (window as any).plausible?.('Signup', { props: { page: location.pathname } });
      msg.innerHTML = `You’re in! Check your inbox for the free guide. <a href="${BASE}/calculators">Open the calculators →</a>`; msg.classList.add('ok');
      markUnlocked();
    } catch (err) {
      msg.textContent = (err as Error).message; msg.classList.add('err');
    } finally {
      btn.disabled = false;
    }
  });
});

void SITE;
