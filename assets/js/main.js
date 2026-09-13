/* Organic Special — homepage logic */

osRequireLang();

let osSelectedProduct = null;
let osModalQty = 1;

/* ---------- Product grid ---------- */
function renderProductGrid() {
  const grid = document.getElementById('productGrid');

  // The bundle lives in its own "offer" card further up the page, not in
  // the regular grid.
  const items = OS_PRODUCTS.filter((p) => p.category !== 'bundle');

  grid.innerHTML = items
    .map(
      (p) => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="product-card" data-id="${p.id}" tabindex="0" role="button" aria-label="${osProductName(p)}">
        <div class="product-media">
          <span class="product-category-tag">${osCategoryName(p.category)}</span>
          <i class="bi ${p.icon}"></i>
        </div>
        <div class="product-body">
          <div class="product-name">${osProductName(p)}</div>
          <div class="product-unit">${osProductUnit(p)}</div>
          <div class="product-price">${osFormatPrice(p.price)}</div>
        </div>
      </div>
    </div>`
    )
    .join('');

  grid.querySelectorAll('.product-card').forEach((card) => {
    const open = () => openProductModal(Number(card.getAttribute('data-id')));
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

/* ---------- Shared product detail modal (products + the bundle) ---------- */
function openProductModal(productId) {
  osSelectedProduct = OS_PRODUCTS.find((p) => p.id === productId);
  if (!osSelectedProduct) return;
  osModalQty = 1;

  const isBundle = osSelectedProduct.category === 'bundle';

  document.getElementById('modalIcon').className = `bi ${osSelectedProduct.icon}`;
  document.getElementById('modalCategory').textContent = isBundle
    ? osT('bundle_offer')
    : osCategoryName(osSelectedProduct.category);
  document.getElementById('modalName').textContent = osProductName(osSelectedProduct);
  document.getElementById('modalUnit').textContent = osProductUnit(osSelectedProduct);
  document.getElementById('modalDesc').textContent = osProductDesc(osSelectedProduct);
  document.getElementById('modalPrice').textContent = osFormatPrice(osSelectedProduct.price);
  document.getElementById('qtyInput').value = osModalQty;

  new bootstrap.Modal(document.getElementById('productModal')).show();
}

document.getElementById('qtyMinus').addEventListener('click', () => {
  osModalQty = Math.max(1, osModalQty - 1);
  document.getElementById('qtyInput').value = osModalQty;
});
document.getElementById('qtyPlus').addEventListener('click', () => {
  osModalQty = Math.min(99, osModalQty + 1);
  document.getElementById('qtyInput').value = osModalQty;
});
document.getElementById('qtyInput').addEventListener('change', (e) => {
  const v = parseInt(e.target.value, 10);
  osModalQty = Number.isFinite(v) && v > 0 ? Math.min(99, v) : 1;
  e.target.value = osModalQty;
});

document.getElementById('addToCartBtn').addEventListener('click', () => {
  if (!osSelectedProduct) return;
  osAddToCart(osSelectedProduct.id, osModalQty);
  bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
  new bootstrap.Toast(document.getElementById('cartToast')).show();
});

/* ---------- Featured product hero ---------- */
function renderFeatured() {
  const p = OS_PRODUCTS.find((x) => x.id === OS_FEATURED_PRODUCT_ID);
  if (!p) return;

  const media = document.getElementById('featuredMedia');
  const img = document.getElementById('featuredImg');
  img.alt = osProductName(p);
  img.addEventListener('error', () => media.classList.add('is-fallback'), { once: true });
  img.src = `assets/img/featured/${p.id}.jpg`;

  document.getElementById('featuredFallbackIcon').className = `bi ${p.icon} os-hero-fallback-icon`;
  document.getElementById('featuredName').textContent = osProductName(p);
  document.getElementById('featuredDesc').textContent = osProductDesc(p);
  document.getElementById('featuredPrice').textContent = osFormatPrice(p.price);

  document.getElementById('featuredSection').addEventListener('click', (e) => {
    if (e.target.closest('#featuredAddBtn')) return;
    openProductModal(p.id);
  });
  document.getElementById('featuredAddBtn').addEventListener('click', () => {
    osAddToCart(p.id, 1);
    new bootstrap.Toast(document.getElementById('cartToast')).show();
  });
}

/* ---------- Bundle offer ---------- */
function renderOffer() {
  const bundle = OS_PRODUCTS.find((x) => x.id === OS_BUNDLE_PRODUCT_ID);
  const items = OS_BUNDLE_ITEM_IDS.map((id) => OS_PRODUCTS.find((x) => x.id === id)).filter(Boolean);
  if (!bundle || items.length < 2) return;

  const regularPrice = items.reduce((sum, p) => sum + p.price, 0);
  const saveAmount = regularPrice - bundle.price;

  document.getElementById('offerItems').innerHTML = items
    .map(
      (p, i) =>
        (i > 0 ? '<span class="os-offer-plus">+</span>' : '') +
        `<span class="os-offer-item"><i class="bi ${p.icon}"></i>${osProductName(p)}</span>`
    )
    .join('');

  document.getElementById('offerOldPrice').textContent = osFormatPrice(regularPrice);
  document.getElementById('offerNewPrice').textContent = osFormatPrice(bundle.price);
  document.getElementById('offerSave').textContent = `${osT('save_label')} ${osFormatPrice(saveAmount)}`;

  document.getElementById('offerSection').addEventListener('click', (e) => {
    if (e.target.closest('#offerAddBtn')) return;
    openProductModal(bundle.id);
  });
  document.getElementById('offerAddBtn').addEventListener('click', () => {
    osAddToCart(bundle.id, 1);
    new bootstrap.Toast(document.getElementById('cartToast')).show();
  });
}

renderFeatured();
renderOffer();
renderProductGrid();

// Let keyboard users activate the hero / offer cards, same as product cards.
[document.getElementById('featuredSection'), document.getElementById('offerSection')].forEach((section) => {
  section.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) {
      e.preventDefault();
      section.click();
    }
  });
});

document.querySelectorAll('[data-lang]').forEach((el) => {
  el.addEventListener('click', () => {
    osSetLang(el.getAttribute('data-lang'));
    window.location.reload();
  });
});
