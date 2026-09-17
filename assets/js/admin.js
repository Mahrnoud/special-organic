/* Organic Special — admin dashboard logic */

const OS_ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'returned'];

/* Orders currently loaded in the table (already filtered by whatever the
   admin has selected). Kept around so Export can reuse the same data
   without an extra request. */
let osLastOrders = [];

function statusSelectHtml(orderId, status) {
  const options = OS_ORDER_STATUSES.map(
    (s) => `<option value="${s}" ${s === status ? 'selected' : ''}>${osT('status_' + s)}</option>`
  ).join('');
  return `<select class="form-select form-select-sm status-select status-select-${status}" data-id="${orderId}">${options}</select>`;
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
    status: document.getElementById('filterStatus').value,
    date_from: document.getElementById('filterDateFrom').value,
    date_to: document.getElementById('filterDateTo').value,
    q: document.getElementById('searchOrderId').value.trim(),
  };
}

/* Sends a status change to the server. Reloads the table afterwards so the
   stat tiles and any other open views stay in sync. */
function updateOrderStatus(orderId, status, selectEl) {
  if (selectEl) selectEl.disabled = true;

  fetch('api/update_order_status.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ id: orderId, status }),
  })
    .then((res) => {
      if (res.status === 401) { window.location.href = 'admin-login.html'; throw new Error('unauthorized'); }
      return res.json();
    })
    .then((data) => {
      if (!data || !data.success) {
        alert((data && data.message) || osT('status_update_error'));
      }
      loadOrders();
    })
    .catch(() => {
      alert(osT('status_update_error'));
      loadOrders();
    });
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
  if (f.status) params.set('status', f.status);
  if (f.date_from) params.set('date_from', f.date_from);
  if (f.date_to) params.set('date_to', f.date_to);
  if (f.q) params.set('q', f.q);

  fetch('api/get_orders.php?' + params.toString(), { credentials: 'same-origin' })
    .then((res) => {
      if (res.status === 401) { window.location.href = 'admin-login.html'; throw new Error('unauthorized'); }
      return res.json();
    })
    .then((data) => {
      loading.classList.add('d-none');
      if (!data || !data.success) return;

      osLastOrders = data.orders || [];

      document.getElementById('statTotal').textContent = data.stats.total;
      document.getElementById('statPending').textContent = data.stats.pending;
      document.getElementById('statConfirmed').textContent = data.stats.confirmed;
      document.getElementById('statShipped').textContent = data.stats.shipped;
      document.getElementById('statDelivered').textContent = data.stats.delivered;
      document.getElementById('statReturned').textContent = data.stats.returned;

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
          <td>${statusSelectHtml(o.id, o.status)}</td>
          <td>${formatDate(o.created_at)}</td>
          <td><button class="btn btn-sm btn-outline-forest view-order-btn" data-id="${o.id}"><span data-i18n="view">${osT('view')}</span></button></td>
        </tr>`
        )
        .join('');

      tbody.querySelectorAll('.status-select').forEach((sel) => {
        sel.addEventListener('change', () => {
          updateOrderStatus(Number(sel.getAttribute('data-id')), sel.value, sel);
        });
      });

      tbody.querySelectorAll('tr').forEach((row) => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.status-select')) return; // let the dropdown work on its own
          openOrderDetails(Number(row.getAttribute('data-id')));
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
      document.getElementById('detailsMobile').textContent = o.mobile_whatsapp;
      document.getElementById('detailsMobileAlt').textContent = o.mobile_additional || '—';
      document.getElementById('detailsTotal').textContent = osFormatPrice(o.total_amount);
      document.getElementById('detailsAddress').textContent = o.address || '—';
      document.getElementById('detailsSubtotal').textContent = osFormatPrice(Number(o.total_amount) - Number(o.shipping_fee || 0));
      document.getElementById('detailsShipping').textContent = osFormatPrice(o.shipping_fee || 0);

      const statusSelect = document.getElementById('detailsStatusSelect');
      statusSelect.innerHTML = OS_ORDER_STATUSES.map(
        (s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${osT('status_' + s)}</option>`
      ).join('');
      statusSelect.className = `form-select form-select-sm status-select status-select-${o.status}`;
      statusSelect.onchange = () => {
        statusSelect.className = `form-select form-select-sm status-select status-select-${statusSelect.value}`;
        updateOrderStatus(o.id, statusSelect.value, statusSelect);
      };

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

/* Builds a nicely formatted .xlsx from whatever is currently loaded in the
   table (i.e. respects the active filters), using the SheetJS library. */
function exportOrdersToExcel() {
  if (!osLastOrders.length) {
    alert(osT('nothing_to_export'));
    return;
  }

  const headers = [
    osT('order_id_col'),
    osT('customer_col'),
    osT('city_col'),
    osT('filter_country'),
    osT('address'),
    osT('mobile_whatsapp'),
    osT('mobile_additional'),
    osT('items_ordered'),
    `${osT('subtotal')} (${osT('currency')})`,
    `${osT('shipping_fee')} (${osT('currency')})`,
    `${osT('total_col')} (${osT('currency')})`,
    osT('status_col'),
    osT('date_col'),
  ];

  const rows = osLastOrders.map((o) => [
    o.id,
    o.full_name,
    o.city,
    o.country,
    o.address || '',
    o.mobile_whatsapp,
    o.mobile_additional || '',
    (o.items || []).map((it) => `${it.name} × ${it.qty}`).join(', '),
    Number(o.total_amount) - Number(o.shipping_fee || 0),
    Number(o.shipping_fee || 0),
    Number(o.total_amount),
    osT('status_' + o.status),
    formatDate(o.created_at),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  ws['!cols'] = [
    { wch: 9 },  // Order #
    { wch: 22 }, // Customer
    { wch: 14 }, // City
    { wch: 10 }, // Country
    { wch: 45 }, // Address
    { wch: 16 }, // Mobile
    { wch: 16 }, // Additional mobile
    { wch: 45 }, // Items
    { wch: 13 }, // Subtotal
    { wch: 13 }, // Shipping fee
    { wch: 13 }, // Total
    { wch: 12 }, // Status
    { wch: 18 }, // Date
  ];

  // Freeze the header row so it stays visible while scrolling in Excel.
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, osT('dashboard_title').slice(0, 31) || 'Orders');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `organic-special-orders-${dateStr}.xlsx`);
}

document.getElementById('filterCountry').addEventListener('change', loadOrders);
document.getElementById('filterCity').addEventListener('change', loadOrders);
document.getElementById('filterStatus').addEventListener('change', loadOrders);
document.getElementById('filterDateFrom').addEventListener('change', loadOrders);
document.getElementById('filterDateTo').addEventListener('change', loadOrders);
document.getElementById('searchOrderId').addEventListener('input', () => {
  clearTimeout(window.__osSearchDebounce);
  window.__osSearchDebounce = setTimeout(loadOrders, 350);
});
document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  document.getElementById('filterCountry').value = '';
  document.getElementById('filterCity').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  document.getElementById('searchOrderId').value = '';
  loadOrders();
});
document.getElementById('exportExcelBtn').addEventListener('click', exportOrdersToExcel);
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
