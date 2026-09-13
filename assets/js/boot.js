/* Runs before anything else renders: picks the right Bootstrap build
   (LTR or RTL) and sets <html lang/dir> based on the saved language,
   so there is no layout flash. Must be loaded with a plain <script src>
   (no defer/async) as the very first thing in <head>. */
(function () {
  var lang = localStorage.getItem('os_lang') || 'en';
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  window.OS_LANG = lang;

  var bootstrapHref = lang === 'ar'
    ? 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css'
    : 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';

  document.write('<link rel="stylesheet" href="' + bootstrapHref + '">');
})();
