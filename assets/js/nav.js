/* Organic Special — shared header & footer behavior.
   Loaded on every page that uses the new header/footer (home.html,
   cart.html). Keeps the mobile menu, smooth-scrolling nav links,
   the language switcher, and the contact details in the footer all
   working the same way everywhere. */

/* ---------- Mobile menu ---------- */
const osNavBurger = document.getElementById('navBurger');
const osMobileNav = document.getElementById('mobileNav');
function osSetMobileNav(isOpen) {
  if (!osNavBurger || !osMobileNav) return;
  osMobileNav.classList.toggle('show', isOpen);
  osNavBurger.setAttribute('aria-expanded', String(isOpen));
  const icon = osNavBurger.querySelector('.bi');
  icon?.classList.toggle('bi-list', !isOpen);
  icon?.classList.toggle('bi-x-lg', isOpen);
}
if (osNavBurger && osMobileNav) {
  osNavBurger.addEventListener('click', () => {
    osSetMobileNav(!osMobileNav.classList.contains('show'));
  });
  osMobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => osSetMobileNav(false));
  });
  document.addEventListener('click', (event) => {
    if (!osMobileNav.contains(event.target) && !osNavBurger.contains(event.target)) osSetMobileNav(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && osMobileNav.classList.contains('show')) {
      osSetMobileNav(false);
      osNavBurger.focus();
    }
  });
  window.matchMedia('(min-width: 992px)').addEventListener('change', (event) => {
    if (event.matches) osSetMobileNav(false);
  });
}

/* ---------- Smooth-scroll for in-page section links ---------- */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    const target = targetId?.startsWith('#') && targetId.length > 1 ? document.getElementById(targetId.slice(1)) : null;
    if (!target) return; // not an in-page anchor on this page — let it behave normally
    e.preventDefault();
    osSetMobileNav(false);
    const header = document.querySelector('.os-topbar');
    const offset = (header ? header.offsetHeight : 0) + 16;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
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
  if (!OS_SITE_CONTENT) return;
  const info = OS_SITE_CONTENT.contact;
  const values = { phone: info.phone, email: info.email, address: osContentText(info.address), hours: osContentText(info.hours) };
  const links = { 'phone-href': info.phone ? 'tel:' + info.phone.replace(/[^+0-9]/g, '') : '',
    'email-href': info.email ? 'mailto:' + info.email : '',
    'whatsapp-href': info.whatsapp, whatsapp: info.whatsapp, facebook: info.facebook, instagram: info.instagram };
  document.querySelectorAll('[data-site]').forEach(el => {
    const key = el.dataset.site;
    if (Object.hasOwn(values, key)) el.textContent = values[key];
    if (Object.hasOwn(links, key)) {
      if (links[key]) el.href = links[key]; else el.removeAttribute('href');
      el.hidden = !links[key];
    }
  });
  document.querySelectorAll('.os-contact-list li').forEach(li => {
    const value = li.querySelector('[data-site]');
    li.hidden = value?.hidden || !value?.textContent.trim();
  });
  const image = document.querySelector('.os-contact-logo');
  if (image) {
    image.closest('.os-contact-logo-wrap').hidden = !info.image;
    if (info.image) image.src = info.image;
  }
}
osContentReady.then(osApplySiteInfo);

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
    document.querySelectorAll('.os-nav-link, .os-mobile-nav a').forEach((link) => {
      const isCurrent = link.getAttribute('href') === '#' + current;
      link.classList.toggle('active', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  document.addEventListener('scroll', osSpy, { passive: true });
  osSpy();
}
