/* Organic Special — shared header & footer behavior.
   Loaded on every page that uses the new header/footer (home.html,
   cart.html). Keeps the mobile menu, smooth-scrolling nav links,
   the language switcher, and the contact details in the footer all
   working the same way everywhere. */

/* ---------- Mobile menu ---------- */
const osNavBurger = document.getElementById('navBurger');
const osMobileNav = document.getElementById('mobileNav');
if (osNavBurger && osMobileNav) {
  osNavBurger.addEventListener('click', () => {
    const isOpen = osMobileNav.classList.toggle('show');
    osNavBurger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

/* ---------- Smooth-scroll for in-page section links ---------- */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    const target = targetId.length > 1 ? document.querySelector(targetId) : null;
    if (!target) return; // not an in-page anchor on this page — let it behave normally
    e.preventDefault();
    const header = document.querySelector('.os-topbar');
    const offset = (header ? header.offsetHeight : 0) + 16;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth',
    });
    osMobileNav?.classList.remove('show');
    osNavBurger?.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Language switcher (top bar dropdown) ---------- */
document.querySelectorAll('[data-lang]').forEach((el) => {
  el.addEventListener('click', () => {
    osSetLang(el.getAttribute('data-lang'));
    window.location.reload();
  });
});

/* ---------- Fill in contact details from site-info.js ---------- */
function osApplySiteInfo() {
  if (typeof OS_SITE_INFO === 'undefined') return;
  const lang = osLang();

  document.querySelectorAll('[data-site="phone"]').forEach((el) => { el.textContent = OS_SITE_INFO.phoneDisplay; });
  document.querySelectorAll('[data-site="phone-href"]').forEach((el) => { el.href = OS_SITE_INFO.phoneHref; });
  document.querySelectorAll('[data-site="whatsapp-href"]').forEach((el) => { el.href = OS_SITE_INFO.whatsappHref; });
  document.querySelectorAll('[data-site="email"]').forEach((el) => { el.textContent = OS_SITE_INFO.email; });
  document.querySelectorAll('[data-site="email-href"]').forEach((el) => { el.href = 'mailto:' + OS_SITE_INFO.email; });
  document.querySelectorAll('[data-site="address"]').forEach((el) => {
    el.textContent = lang === 'ar' ? OS_SITE_INFO.address_ar : OS_SITE_INFO.address_en;
  });
  document.querySelectorAll('[data-site="hours"]').forEach((el) => {
    el.textContent = lang === 'ar' ? OS_SITE_INFO.hours_ar : OS_SITE_INFO.hours_en;
  });
  document.querySelectorAll('[data-site="facebook"]').forEach((el) => { el.href = OS_SITE_INFO.social.facebook; });
  document.querySelectorAll('[data-site="instagram"]').forEach((el) => { el.href = OS_SITE_INFO.social.instagram; });
  document.querySelectorAll('[data-site="whatsapp"]').forEach((el) => { el.href = OS_SITE_INFO.social.whatsapp; });
}
osApplySiteInfo();

/* ---------- Footer year ---------- */
document.querySelectorAll('[data-current-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

/* ---------- Highlight the current section while scrolling (home page only) ---------- */
const osNavSections = ['topSection', 'productsSection', 'aboutSection', 'contactSection']
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if (osNavSections.length > 0) {
  const osSpy = () => {
    const header = document.querySelector('.os-topbar');
    const offset = (header ? header.offsetHeight : 0) + 24;
    let current = osNavSections[0].id;
    osNavSections.forEach((section) => {
      if (section.getBoundingClientRect().top - offset <= 0) current = section.id;
    });
    document.querySelectorAll('.os-nav-link').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  };
  document.addEventListener('scroll', osSpy, { passive: true });
  osSpy();
}
