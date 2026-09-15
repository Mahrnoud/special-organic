/* Show the branded transition on every home-page load, including refreshes. */
(function () {
  const loader = document.getElementById('homeLoader');
  const label = document.getElementById('homeLoadingLabel');
  label.textContent = document.documentElement.lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…';
  document.body.classList.add('os-home-loading');

  // Start with the first painted frame; the fade is part of the three seconds.
  requestAnimationFrame(function () {
    setTimeout(function () {
      document.body.classList.add('os-home-revealing');
    }, 2700);

    setTimeout(function () {
      document.body.classList.remove('os-home-loading', 'os-home-revealing');
      loader.remove();
    }, 3000);
  });
})();
