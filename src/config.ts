// One place for site-wide settings. Edit these, not the templates.
export const SITE = {
  name: 'Money Made Simple',
  tagline: 'Money made simple.',
  description:
    'Free calculators that show what your money decisions really cost, using your own numbers.',
  // Currency used in every calculator and in the hero. Change both together.
  currency: '$',
  locale: 'en-US',
  contactEmail: 'hello@example.com', // shown on privacy / unsubscribe pages
  legalName: 'Money Made Simple', // the entity that owns the email list
  privacyOfficer: 'Billy Motumi', // POPIA "Information Officer"
  accessCookie: 'mms_access',
  plausibleDomain: import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN as string | undefined,
};

export const CONSENT_TEXT =
  'Send me the free guide and occasional emails from Money Made Simple. I can unsubscribe at any time.';
