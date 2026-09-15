/* Organic Special — store contact & social details.
   Edit the values below and every place that shows a phone number,
   email, address or map (the contact section, the trust bar, and the
   footer) updates automatically. Nothing here needs to match the
   checkout WhatsApp number — this is just how customers reach you. */

const OS_SITE_INFO = {
  // Shown as plain text and used for the "tel:" / "mailto:" / WhatsApp links.
  phoneDisplay: '01000000000',
  phoneHref: 'tel:+201000000000',

  whatsappDisplay: '01000000000',
  whatsappHref: 'https://wa.me/201000000000',

  email: 'hello@organicspecial.example',

  address_en: 'Cairo, Egypt',
  address_ar: 'القاهرة، مصر',

  hours_en: 'Saturday – Thursday, 10:00 AM – 8:00 PM',
  hours_ar: 'السبت - الخميس، ١٠:٠٠ ص - ٨:٠٠ م',

  // Basic embed, no Google API key required. To point it at a precise
  // address instead of just "Cairo", replace the q= value, e.g.
  // q=30.0444,31.2357 for exact coordinates, or q=Your+Shop+Name+Cairo.
  mapEmbedUrl: 'https://www.google.com/maps?q=Cairo,Egypt&z=12&output=embed',

  social: {
    facebook: '#',
    instagram: '#',
    whatsapp: 'https://wa.me/201000000000',
  },
};
