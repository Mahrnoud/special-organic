/* Organic Special — admin dashboard logic */

function statusBadgeHtml(status) {
  const map = {
    pending: { cls: 'badge-status-pending', key: 'status_pending' },
    confirmed: { cls: 'badge-status-confirmed', key: 'status_confirmed' },
    cancelled: { cls: 'badge-status-cancelled', key: 'status_cancelled' },
  };
  const s = map[status] || map.pending;
  return `<span class="badge ${s.cls}">${osT(s.key)}</span>`;
}

function formatDate(isoString) {
  const d = new Date(isoString.replace(' ', 'T'));
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString(osLang() === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function populateCityFilter() {
  const select = document.getElementById('filterCity');
  OS_EGYPT_CITIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = osLang() === 'ar' ? c.ar : c.en;
    opt.textContent = osLang() === 'ar' ? c.ar : c.en;
    select.appendChild(opt);
  });
}

function currentFilters() {
  return {
    country: document.getElementById('filterCountry').value,
    city: document.getElementById('filterCity').value,
    q: document.getElementById('searchOrderId').value.trim(),
  };
}

function loadOrders() {
  const loading = document.getElementById('loadingMsg');
  const noOrders = document.getElementById('noOrdersMsg');
  const tbody = document.getElementById('ordersTableBody');
  loading.classList.remove('d-none');
  noOrders.classList.add('d-none');
  tbody.innerHTML = '';

  const f = currentFilters();
  const params = new URLSearchParams();
  if (f.country) params.set('country', f.country);
  if (f.city) params.set('city', f.city);
  if (f.q) params.set('q', f.q);

  fetch('api/get_orders.php?' + params.toString(), { credentials: 'same-origin' })
    .then((res) => {
      if (res.status === 401) { window.location.href = 'admin-login.html'; throw new Error('unauthorized'); }
      return res.json();
    })
    .then((data) => {
      loading.classList.add('d-none');
      if (!data || !data.success) return;

      document.getElementById('statTotal').textContent = data.stats.total;
      document.getElementById('statPending').textContent = data.stats.pending;
      document.getElementById('statConfirmed').textContent = data.stats.confirmed;

      if (data.orders.length === 0) {
        noOrders.classList.remove('d-none');
        return;
      }

      tbody.innerHTML = data.orders
        .map(
          (o) => `
        <tr data-id="${o.id}">
          <td>#${o.id}</td>
          <td>${o.full_name}</td>
          <td>${o.city}</td>
          <td>${o.mobile_whatsapp}</td>
          <td>${osFormatPrice(o.total_amount)}</td>
          <td>${statusBadgeHtml(o.status)}</td>
          <td>${formatDate(o.created_at)}</td>
          <td><button class="btn btn-sm btn-outline-forest view-order-btn" data-id="${o.id}"><span data-i18n="view">${osT('view')}</span></button></td>
        </tr>`
        )
        .join('');

      tbody.querySelectorAll('tr').forEach((row) => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.view-order-btn') || true) {
            openOrderDetails(Number(row.getAttribute('data-id')));
          }
        });
      });
    })
    .catch(() => { loading.classList.add('d-none'); });
}

function openOrderDetails(orderId) {
  fetch('api/get_order.php?id=' + orderId, { credentials: 'same-origin' })
    .then((res) => {
      if (res.status === 401) { window.location.href = 'admin-login.html'; throw new Error('unauthorized'); }
      return res.json();
    })
    .then((data) => {
      if (!data || !data.success) return;
      const o = data.order;
      document.getElementById('detailsOrderId').textContent = '#' + o.id;
      document.getElementById('detailsName').textContent = o.full_name;
      document.getElementById('detailsDate').textContent = formatDate(o.created_at);
      document.getElementById('detailsCity').textContent = `${o.city}, ${o.country}`;
      document.getElementById('detailsStatus').innerHTML = statusBadgeHtml(o.status);
      document.getElementById('detailsMobile').textContent = o.mobile_whatsapp;
      document.getElementById('detailsMobileAlt').textContent = o.mobile_additional || '—';
      document.getElementById('detailsTotal').textContent = osFormatPrice(o.total_amount);

      const list = document.getElementById('detailsItems');
      list.innerHTML = o.items
        .map(
          (it) => `<li class="list-group-item d-flex justify-content-between">
            <span>${it.name} × ${it.qty}</span>
            <span class="fw-bold">${osFormatPrice(it.price * it.qty)}</span>
          </li>`
        )
        .join('');

      new bootstrap.Modal(document.getElementById('orderDetailsModal')).show();
    });
}

document.getElementById('filterCountry').addEventListener('change', loadOrders);
document.getElementById('filterCity').addEventListener('change', loadOrders);
document.getElementById('searchOrderId').addEventListener('input', () => {
  clearTimeout(window.__osSearchDebounce);
  window.__osSearchDebounce = setTimeout(loadOrders, 350);
});
document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  document.getElementById('filterCountry').value = '';
  document.getElementById('filterCity').value = '';
  document.getElementById('searchOrderId').value = '';
  loadOrders();
});
document.getElementById('logoutBtn').addEventListener('click', () => {
  fetch('api/admin_logout.php', { method: 'POST', credentials: 'same-origin' })
    .finally(() => { window.location.href = 'admin-login.html'; });
});

/* Guard: verify the admin session before showing anything. */
fetch('api/check_session.php', { credentials: 'same-origin' })
  .then((res) => res.json())
  .then((data) => {
    if (!data || !data.logged_in) {
      window.location.href = 'admin-login.html';
      return;
    }
    populateCityFilter();
    loadOrders();
  })
  .catch(() => { window.location.href = 'admin-login.html'; });
