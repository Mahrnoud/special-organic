/* Organic Special — cart & checkout logic */


const EG_MOBILE_RE = /^01[0125][0-9]{8}$/;
let osShippingRates = [];
let osShippingLoaded = false;

function osCartShipping() {
  if (!osCartLinesWithDetails().length) return 0;
  const city = document.getElementById('citySelect').value;
  return osShippingLoaded ? osShippingRates.find((rate) => rate.code === city)?.fee ?? null : null;
}

function osCartGrandTotal() {
  const shipping = osCartShipping();
  return shipping === null ? null : osCartTotal() + shipping;
}

function renderCartSummary() {
  const shipping = osCartShipping();
  document.getElementById('summaryCount').textContent = osCartCount();
  document.getElementById('summarySubtotal').textContent = osFormatPrice(osCartTotal());
  document.getElementById('summaryShipping').textContent = shipping === null
    ? osT(osShippingLoaded ? 'shipping_select_city' : 'shipping_unavailable') : osFormatPrice(shipping);
  document.getElementById('summaryTotal').textContent = shipping === null ? '—' : osFormatPrice(osCartGrandTotal());
}

async function loadCheckoutShipping() {
  osShippingLoaded = false;
  try {
    const response = await fetch('api/get_shipping.php', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.rates) ||
        !OS_EGYPT_CITIES.every((city) => data.rates.some((rate) => rate.code === city.code && Number.isFinite(rate.fee) && rate.fee >= 0))) {
      throw new Error('Invalid shipping rates');
    }
    osShippingRates = data.rates;
    osShippingLoaded = true;
  } catch (_) {
    showOrderError(osT('shipping_load_error'));
  }
  renderCartSummary();
  return osShippingLoaded;
}

function renderCityOptions() {
  const select = document.getElementById('citySelect');
  OS_EGYPT_CITIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = osLang() === 'ar' ? c.ar : c.en;
    select.appendChild(opt);
  });
}

function renderCart() {
  const lines = osCartLinesWithDetails();
  const emptyState = document.getElementById('cartEmptyState');
  const content = document.getElementById('cartContent');
  const successState = document.getElementById('orderSuccessState');

  if (successState.classList.contains('d-none') === false) return; // don't re-render after success

  if (lines.length === 0) {
    emptyState.classList.remove('d-none');
    content.classList.add('d-none');
    return;
  }
  emptyState.classList.add('d-none');
  content.classList.remove('d-none');

  const wrap = document.getElementById('cartLines');
  wrap.innerHTML = lines
    .map(
      (l) => `
    <div class="cart-line d-flex align-items-center gap-3" data-id="${l.id}" data-size-id="${l.size_id}">
      <div class="cart-line-icon">${osProductMediaMarkup(l.product)}</div>
      <div class="flex-grow-1 cart-line-info">
        <div class="fw-bold">${osImageAttribute(osProductName(l.product))}</div>
        <div class="text-muted-soft small">${osImageAttribute(osVariantLabel(l.variant))} · ${osFormatPrice(l.variant.price)} <span data-i18n="each">each</span></div>
      </div>
      <div class="qty-stepper">
        <button type="button" class="line-minus" aria-label="Decrease quantity">−</button>
        <input type="text" class="line-qty" value="${l.qty}" inputmode="numeric" aria-label="Quantity">
        <button type="button" class="line-plus" aria-label="Increase quantity">+</button>
      </div>
      <div class="text-end cart-line-total" style="min-width:80px;">
        <div class="fw-bold">${osFormatPrice(l.lineTotal)}</div>
        <button type="button" class="btn btn-link btn-sm text-danger p-0 line-remove" data-i18n="remove">Remove</button>
      </div>
    </div>`
    )
    .join('');
  osApplyI18n(wrap);
  osLoadImages(wrap);

  wrap.querySelectorAll('.cart-line').forEach((row) => {
    const id = Number(row.getAttribute('data-id'));
    const sizeId = Number(row.dataset.sizeId);
    row.querySelector('.line-minus').addEventListener('click', () => {
      const current = osGetCart().find((l) => l.id === id && l.size_id === sizeId);
      osUpdateCartQty(id, (current ? current.qty : 1) - 1, sizeId);
      renderCart();
    });
    row.querySelector('.line-plus').addEventListener('click', () => {
      const current = osGetCart().find((l) => l.id === id && l.size_id === sizeId);
      osUpdateCartQty(id, (current ? current.qty : 0) + 1, sizeId);
      renderCart();
    });
    row.querySelector('.line-qty').addEventListener('change', (e) => {
      const v = Math.max(1, parseInt(e.target.value, 10) || 1);
      osUpdateCartQty(id, v, sizeId);
      renderCart();
    });
    row.querySelector('.line-remove').addEventListener('click', () => {
      osRemoveFromCart(id, sizeId);
      renderCart();
    });
  });

  renderCartSummary();
}

function setFieldValidity(el, isValid) {
  el.classList.toggle('is-invalid', !isValid);
  el.setAttribute('aria-invalid', String(!isValid));
  if (el.id === 'mobileWhatsapp') {
    document.getElementById('mobileWhatsappError').classList.toggle('d-block', !isValid);
  }
}

function showOrderError(message) {
  const box = document.getElementById('orderErrorBox');
  box.textContent = message;
  box.classList.remove('d-none');
}

function hideOrderError() {
  document.getElementById('orderErrorBox').classList.add('d-none');
}

document.getElementById('checkoutForm').addEventListener('submit', function (e) {
  e.preventDefault();
  hideOrderError();
  if (!osCatalogLoaded) { showOrderError(osT('catalog_error')); return; }
  if (!osShippingLoaded) { showOrderError(osT('shipping_load_error')); return; }

  const fullName = document.getElementById('fullName').value.trim();
  const city = document.getElementById('citySelect').value;
  const address = document.getElementById('address').value.trim();
  const mobileWhatsapp = document.getElementById('mobileWhatsapp').value.trim();
  const mobileAdditional = document.getElementById('mobileAdditional').value.trim();

  let valid = true;
  setFieldValidity(document.getElementById('fullName'), fullName.length > 0);
  if (fullName.length === 0) valid = false;

  const cityOk = osCartShipping() !== null && city.length > 0;
  setFieldValidity(document.getElementById('citySelect'), cityOk);
  if (!cityOk) valid = false;

  const addressOk = address.length > 0 && address.length <= 500;
  setFieldValidity(document.getElementById('address'), addressOk);
  if (!addressOk) valid = false;

  const whatsappOk = EG_MOBILE_RE.test(mobileWhatsapp);
  setFieldValidity(document.getElementById('mobileWhatsapp'), whatsappOk);
  if (!whatsappOk) valid = false;

  const additionalOk = mobileAdditional.length === 0 || EG_MOBILE_RE.test(mobileAdditional);
  setFieldValidity(document.getElementById('mobileAdditional'), additionalOk);
  if (!additionalOk) valid = false;

  if (!valid) {
    this.querySelector('.is-invalid')?.focus();
    return;
  }

  const lines = osCartLinesWithDetails();
  const payload = {
    language: osLang(),
    full_name: fullName,
    city_code: city,
    address: address,
    mobile_whatsapp: mobileWhatsapp,
    mobile_additional: mobileAdditional || null,
    items: lines.map((l) => ({
      id: l.product.id,
      name: osProductName(l.product),
      qty: l.qty,
      price: l.variant.price,
      size_id: l.size_id,
    })),
    shipping_fee: osCartShipping(),
    total: osCartGrandTotal(),
  };

  const submitBtn = document.getElementById('placeOrderBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${osT('loading')}`;

  fetch('api/create_order.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then(async (data) => {
      if (data && data.success) {
        document.getElementById('cartContent').classList.add('d-none');
        document.getElementById('cartEmptyState').classList.add('d-none');
        document.getElementById('successOrderId').textContent = '#' + data.order_id;
        document.getElementById('orderSuccessState').classList.remove('d-none');
        osClearCart();
      } else {
        if (data?.code === 'shipping_changed') {
          if (await loadCheckoutShipping()) showOrderError(osT('shipping_changed'));
        } else {
          showOrderError((data && data.message) || osT('order_error_generic'));
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span data-i18n="place_order">${osT('place_order')}</span>`;
      }
    })
    .catch(() => {
      showOrderError(osT('order_error_generic'));
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span data-i18n="place_order">${osT('place_order')}</span>`;
    });
});

if (osLang() === 'ar') {
  document.getElementById('backArrowIcon').className = 'bi bi-arrow-right me-1';
}

renderCityOptions();
document.getElementById('citySelect').addEventListener('change', renderCartSummary);
document.getElementById('placeOrderBtn').disabled = true;
document.getElementById('cartContent').classList.add('d-none');
Promise.all([osCatalogReady, loadCheckoutShipping()]).then(([loaded]) => {
  if (!loaded) {
    document.getElementById('cartContent').classList.remove('d-none');
    showOrderError(osT('catalog_error'));
    return;
  }
  osReconcileCart();
  document.getElementById('placeOrderBtn').disabled = false;
  renderCart();
});
