/* Organic Special — admin login logic */

document.getElementById('adminLoginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const errorBox = document.getElementById('loginErrorBox');
  errorBox.classList.add('d-none');

  const phone = document.getElementById('adminPhone').value.trim();
  const password = document.getElementById('adminPassword').value;
  const btn = document.getElementById('adminLoginBtn');

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${osT('loading')}`;

  fetch('api/admin_login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.success) {
        window.location.href = '/admin-dashboard';
      } else {
        errorBox.textContent = (data && data.message) || osT('login_error');
        errorBox.classList.remove('d-none');
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    })
    .catch(() => {
      errorBox.textContent = osT('server_unreachable');
      errorBox.classList.remove('d-none');
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    });
});
