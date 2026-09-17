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
  return `<select class="form-select form-select-sm status-select status-select-${status}" data-id="${orderId}" data-status="${status}" aria-label="${osEscape(osT('status_col'))} #${orderId}">${options}</select>`;
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

const osSelectedOrders = new Set();
let osOrdersBusy = false;
let osOrdersRequest = 0;

function osEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function osAdminRequest(url, options = {}) {
  const res = await fetch(url, { credentials: 'same-origin', ...options });
  if (res.status === 401) { window.location.href = 'admin-login.html'; throw new Error(osT('session_expired')); }
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || osT('request_error'));
  return data;
}

function osAdminNotice(message, error = false) {
  const box = document.getElementById('adminNotice');
  box.textContent = message;
  box.className = 'alert ' + (error ? 'alert-danger' : 'alert-success');
}

function syncOrderSelection() {
  const count = osSelectedOrders.size;
  document.getElementById('selectedOrderCount').textContent = osT('orders_selected').replace('{count}', count);
  const all = document.getElementById('selectAllOrders');
  all.checked = osLastOrders.length > 0 && count === osLastOrders.length;
  all.indeterminate = count > 0 && count < osLastOrders.length;
  all.disabled = osOrdersBusy || !osLastOrders.length;
  for (const id of ['bulkOrderStatus', 'applyBulkStatus', 'clearSelection']) {
    document.getElementById(id).disabled = osOrdersBusy || !count;
  }
  document.querySelectorAll('.order-selector').forEach((checkbox) => {
    checkbox.checked = osSelectedOrders.has(Number(checkbox.dataset.id));
    checkbox.disabled = osOrdersBusy;
    checkbox.closest('tr').classList.toggle('order-selected', checkbox.checked);
  });
  document.querySelectorAll('#ordersPanel .status-select').forEach((select) => { select.disabled = osOrdersBusy; });
  document.getElementById('detailsStatusSelect').disabled = osOrdersBusy;
}

async function updateOrderStatus(orderId, status, selectEl) {
  if (osOrdersBusy) return;
  const previous = selectEl?.dataset.status;
  osOrdersBusy = true;
  syncOrderSelection();
  if (selectEl) selectEl.disabled = true;
  try {
    await osAdminRequest('api/update_order_status.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status }),
    });
    if (selectEl) {
      selectEl.dataset.status = status;
      selectEl.className = `form-select form-select-sm status-select status-select-${status}`;
    }
    await loadOrders();
  } catch (error) {
    if (selectEl && previous) {
      selectEl.value = previous;
      selectEl.className = `form-select form-select-sm status-select status-select-${previous}`;
    }
    osAdminNotice(error.message || osT('status_update_error'), true);
  } finally {
    osOrdersBusy = false;
    syncOrderSelection();
    if (selectEl) selectEl.disabled = false;
  }
}

async function loadOrders() {
  const request = ++osOrdersRequest;
  const loading = document.getElementById('loadingMsg');
  const noOrders = document.getElementById('noOrdersMsg');
  const tbody = document.getElementById('ordersTableBody');
  loading.classList.remove('d-none');
  noOrders.classList.add('d-none');
  tbody.innerHTML = '';
  osLastOrders = [];
  osSelectedOrders.clear();
  syncOrderSelection();
  const params = new URLSearchParams();
  Object.entries(currentFilters()).forEach(([key, value]) => { if (value) params.set(key, value); });
  try {
    const data = await osAdminRequest('api/get_orders.php?' + params);
    if (request !== osOrdersRequest) return;
    osLastOrders = data.orders || [];
    for (const key of ['total', ...OS_ORDER_STATUSES]) {
      document.getElementById('stat' + key[0].toUpperCase() + key.slice(1)).textContent = data.stats[key];
    }
    noOrders.classList.toggle('d-none', osLastOrders.length > 0);
    tbody.innerHTML = osLastOrders.map((o) => `
      <tr data-id="${o.id}">
        <td class="order-checkbox-cell"><input type="checkbox" class="form-check-input order-selector" data-id="${o.id}" aria-label="${osEscape(osT('select_order'))} #${o.id}"></td>
        <td>#${o.id}</td><td>${osEscape(o.full_name)}</td><td>${osEscape(o.city)}</td>
        <td>${osEscape(o.mobile_whatsapp)}</td><td>${osFormatPrice(o.total_amount)}</td>
        <td>${statusSelectHtml(o.id, o.status)}</td><td>${osEscape(formatDate(o.created_at))}</td>
        <td><button class="btn btn-sm btn-outline-forest view-order-btn" data-id="${o.id}">${osT('view')}</button></td>
      </tr>`).join('');
    tbody.querySelectorAll('.order-selector').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const id = Number(checkbox.dataset.id);
        if (checkbox.checked) osSelectedOrders.add(id); else osSelectedOrders.delete(id);
        syncOrderSelection();
      });
    });
    tbody.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', () => updateOrderStatus(Number(select.dataset.id), select.value, select));
    });
    tbody.querySelectorAll('tr').forEach((row) => {
      row.addEventListener('click', (event) => {
        if (event.target.closest('.status-select, .order-checkbox-cell')) return;
        openOrderDetails(Number(row.dataset.id));
      });
    });
    syncOrderSelection();
  } catch (error) {
    if (request === osOrdersRequest) osAdminNotice(error.message || osT('request_error'), true);
  } finally {
    if (request === osOrdersRequest) loading.classList.add('d-none');
  }
}

const bulkStatus = document.getElementById('bulkOrderStatus');
bulkStatus.innerHTML = `<option value="">${osT('choose_status')}</option>` + OS_ORDER_STATUSES.map((s) => `<option value="${s}">${osT('status_' + s)}</option>`).join('');
document.getElementById('selectAllOrders').setAttribute('aria-label', osT('select_all_orders'));
document.getElementById('selectAllOrders').addEventListener('change', (event) => {
  osSelectedOrders.clear();
  if (event.target.checked) osLastOrders.forEach((order) => osSelectedOrders.add(order.id));
  syncOrderSelection();
});
document.getElementById('clearSelection').addEventListener('click', () => { osSelectedOrders.clear(); syncOrderSelection(); });
document.getElementById('applyBulkStatus').addEventListener('click', async () => {
  if (osOrdersBusy || !osSelectedOrders.size) return;
  if (!bulkStatus.value) { bulkStatus.focus(); osAdminNotice(osT('choose_status'), true); return; }
  const ids = [...osSelectedOrders];
  const status = bulkStatus.value;
  osOrdersBusy = true;
  syncOrderSelection();
  try {
    const data = await osAdminRequest('api/update_order_status.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, status }),
    });
    osAdminNotice(osT('orders_updated').replace('{count}', data.updated_count));
    bulkStatus.value = '';
    await loadOrders();
  } catch (error) {
    osAdminNotice(error.message || osT('status_update_error'), true);
  } finally {
    osOrdersBusy = false;
    syncOrderSelection();
  }
});
syncOrderSelection();

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
      statusSelect.dataset.status = o.status;
      statusSelect.disabled = osOrdersBusy;
      statusSelect.onchange = () => {
        statusSelect.className = `form-select form-select-sm status-select status-select-${statusSelect.value}`;
        updateOrderStatus(o.id, statusSelect.value, statusSelect);
      };

      const list = document.getElementById('detailsItems');
      list.innerHTML = o.items
        .map(
          (it) => `<li class="list-group-item d-flex justify-content-between">
            <span>${osEscape(it.name)} × ${osEscape(it.qty)}</span>
            <span class="fw-bold">${osFormatPrice(it.price * it.qty)}</span>
          </li>`
        )
        .join('');

      bootstrap.Modal.getOrCreateInstance(document.getElementById('orderDetailsModal')).show();
    }).catch(() => osAdminNotice(osT('request_error'), true));
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
    (o.items || []).map((it) => `${osEscape(it.name)} × ${osEscape(it.qty)}`).join(', '),
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
    loadProducts();
    loadShipping();
  })
  .catch(() => { window.location.href = 'admin-login.html'; });
