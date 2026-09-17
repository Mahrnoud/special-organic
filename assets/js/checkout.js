/* Organic Special — cart & checkout logic */

osRequireLang();

const EG_MOBILE_RE = /^01[0125][0-9]{8}$/;

function renderCityOptions() {
  const select = document.getElementById('citySelect');
  OS_EGYPT_CITIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = osLang() === 'ar' ? c.ar : c.en;
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
    <div class="cart-line d-flex align-items-center gap-3" data-id="${l.id}">
      <div class="cart-line-icon">${osProductMediaMarkup(l.product)}</div>
      <div class="flex-grow-1">
        <div class="fw-bold">${osProductName(l.product)}</div>
        <div class="text-muted-soft small">${osFormatPrice(l.product.price)} <span data-i18n="each">each</span></div>
      </div>
      <div class="qty-stepper">
        <button type="button" class="line-minus" aria-label="Decrease quantity">−</button>
        <input type="text" class="line-qty" value="${l.qty}" inputmode="numeric" aria-label="Quantity">
        <button type="button" class="line-plus" aria-label="Increase quantity">+</button>
      </div>
      <div class="text-end" style="min-width:80px;">
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
    row.querySelector('.line-minus').addEventListener('click', () => {
      const current = osGetCart().find((l) => l.id === id);
      osUpdateCartQty(id, (current ? current.qty : 1) - 1);
      renderCart();
    });
    row.querySelector('.line-plus').addEventListener('click', () => {
      const current = osGetCart().find((l) => l.id === id);
      osUpdateCartQty(id, (current ? current.qty : 0) + 1);
      renderCart();
    });
    row.querySelector('.line-qty').addEventListener('change', (e) => {
      const v = Math.max(1, parseInt(e.target.value, 10) || 1);
      osUpdateCartQty(id, v);
      renderCart();
    });
    row.querySelector('.line-remove').addEventListener('click', () => {
      osRemoveFromCart(id);
      renderCart();
    });
  });

  document.getElementById('summaryCount').textContent = osCartCount();
  document.getElementById('summarySubtotal').textContent = osFormatPrice(osCartTotal());
  document.getElementById('summaryShipping').textContent = osFormatPrice(osCartShipping());
  document.getElementById('summaryTotal').textContent = osFormatPrice(osCartGrandTotal());
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

  const fullName = document.getElementById('fullName').value.trim();
  const city = document.getElementById('citySelect').value;
  const address = document.getElementById('address').value.trim();
  const mobileWhatsapp = document.getElementById('mobileWhatsapp').value.trim();
  const mobileAdditional = document.getElementById('mobileAdditional').value.trim();

  let valid = true;
  setFieldValidity(document.getElementById('fullName'), fullName.length > 0);
  if (fullName.length === 0) valid = false;

  setFieldValidity(document.getElementById('citySelect'), city.length > 0);
  if (city.length === 0) valid = false;

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
    full_name: fullName,
    city: city,
    country: 'Egypt',
    address: address,
    mobile_whatsapp: mobileWhatsapp,
    mobile_additional: mobileAdditional || null,
    items: lines.map((l) => ({
      id: l.product.id,
      name: osProductName(l.product),
      qty: l.qty,
      price: l.product.price,
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
    .then((data) => {
      if (data && data.success) {
        document.getElementById('cartContent').classList.add('d-none');
        document.getElementById('cartEmptyState').classList.add('d-none');
        document.getElementById('successOrderId').textContent = '#' + data.order_id;
        document.getElementById('orderSuccessState').classList.remove('d-none');
        osClearCart();
      } else {
        showOrderError((data && data.message) || osT('order_error_generic'));
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
renderCart();
