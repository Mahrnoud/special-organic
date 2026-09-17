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
      <div class="product-card" data-id="${p.id}">
        <div class="product-media">
          <span class="product-category-tag">${osCategoryName(p.category)}</span>
          ${osProductMediaMarkup(p)}
        </div>
        <div class="product-body">
          <button type="button" class="product-name product-details-button" aria-haspopup="dialog">${osProductName(p)}</button>
          <div class="product-unit">${osProductUnit(p)}</div>
          <div class="product-card-actions">
            <div class="product-price">${osFormatPrice(p.price)}</div>
            <button type="button" class="btn btn-forest product-quick-add" title="${osImageAttribute(osT('add_to_cart'))}" aria-label="${osImageAttribute(osT('add_to_cart') + ' — ' + osProductName(p))}">
              <i class="bi bi-cart-plus" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`
    )
    .join('');

  osLoadImages(grid);
  grid.querySelectorAll('.product-card').forEach((card) => {
    const id = Number(card.getAttribute('data-id'));
    card.querySelector('.product-details-button').addEventListener('click', () => openProductModal(id));
    card.querySelector('.product-quick-add').addEventListener('click', () => {
      osAddToCart(id, 1);
      bootstrap.Toast.getOrCreateInstance(document.getElementById('cartToast')).show();
    });
  });
}

/* ---------- Shared product detail modal (products + the bundle) ---------- */
function renderProductGallery(product) {
  const media = document.getElementById('modalMedia');
  const images = osProductImages(product);
  media.onkeydown = null;
  media.onpointerdown = null;
  media.onpointerup = null;
  if (images.length < 2) {
    media.innerHTML = osProductMediaMarkup(product, false);
    osLoadImages(media);
    return;
  }

  media.innerHTML = `<div class="product-gallery" role="region" aria-label="${osImageAttribute(osT('product_photos'))}" tabindex="0">
    ${images.map((src, i) => `<div class="product-gallery-slide" ${i ? 'hidden' : ''}>${osImageMarkup(src, `${osProductName(product)} — ${i + 1}`, product.icon, false)}</div>`).join('')}
    <button type="button" class="product-gallery-arrow product-gallery-prev" aria-label="${osImageAttribute(osT('previous_photo'))}"><span aria-hidden="true">‹</span></button>
    <button type="button" class="product-gallery-arrow product-gallery-next" aria-label="${osImageAttribute(osT('next_photo'))}"><span aria-hidden="true">›</span></button>
    <div class="product-gallery-dots">${images.map((_, i) => `<button type="button" aria-label="${osImageAttribute(osT('photo'))} ${i + 1}" aria-pressed="${i === 0}"></button>`).join('')}</div>
    <span class="visually-hidden product-gallery-status" aria-live="polite" aria-atomic="true"></span>
  </div>`;
  const slides = media.querySelectorAll('.product-gallery-slide');
  const dots = media.querySelectorAll('.product-gallery-dots button');
  let index = 0;
  const show = (next) => {
    index = (next + images.length) % images.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
    media.querySelector('.product-gallery-status').textContent = `${osT('photo')} ${index + 1} / ${images.length}`;
  };
  const rtl = osLang() === 'ar';
  media.querySelector('.product-gallery-prev').onclick = () => show(index - 1);
  media.querySelector('.product-gallery-next').onclick = () => show(index + 1);
  dots.forEach((dot, i) => { dot.onclick = () => show(i); });
  media.onkeydown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    show(index + ((e.key === 'ArrowRight') !== rtl ? 1 : -1));
  };
  let start = null;
  media.onpointerdown = (e) => { start = { x: e.clientX, y: e.clientY }; };
  media.onpointerup = (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + ((dx < 0) !== rtl ? 1 : -1));
  };
  show(0);
  osLoadImages(media);
}

function openProductModal(productId) {
  osSelectedProduct = OS_PRODUCTS.find((p) => p.id === productId);
  if (!osSelectedProduct) return;
  osModalQty = 1;

  const isBundle = osSelectedProduct.category === 'bundle';

  renderProductGallery(osSelectedProduct);
  document.getElementById('modalCategory').textContent = isBundle
    ? osT('bundle_offer')
    : osCategoryName(osSelectedProduct.category);
  document.getElementById('modalName').textContent = osProductName(osSelectedProduct);
  document.getElementById('modalUnit').textContent = osProductUnit(osSelectedProduct);
  document.getElementById('modalDesc').textContent = osProductDesc(osSelectedProduct);
  const ingredients = osProductIngredients(osSelectedProduct).trim();
  document.getElementById('modalIngredients').textContent = ingredients;
  document.getElementById('modalIngredientsSection').hidden = !ingredients;
  document.getElementById('modalPrice').textContent = osFormatPrice(osSelectedProduct.price);
  document.getElementById('qtyInput').value = osModalQty;

  bootstrap.Modal.getOrCreateInstance(document.getElementById('productModal')).show();
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

/* ---------- Featured product hero (slide 1 of the hero slider) ---------- */
function renderFeatured() {
  const p = OS_PRODUCTS.find((x) => x.id === OS_FEATURED_PRODUCT_ID);
  if (!p) return;

  const media = document.getElementById('featuredMedia');
  media.innerHTML = osProductMediaMarkup(p, false);
  osLoadImages(media);
  document.getElementById('featuredName').textContent = osProductName(p);
  document.getElementById('featuredDesc').textContent = osProductDesc(p);
  document.getElementById('featuredPrice').textContent = osFormatPrice(p.price);

  document.getElementById('featuredSection').addEventListener('click', (e) => {
    if (e.target.closest('#featuredAddBtn')) return;
    openProductModal(p.id);
  });
  document.getElementById('featuredSection').addEventListener('keydown', (e) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openProductModal(p.id);
    }
  });
  document.getElementById('featuredAddBtn').addEventListener('click', () => {
    osAddToCart(p.id, 1);
    new bootstrap.Toast(document.getElementById('cartToast')).show();
  });
}

/* ---------- Bundle offer (bottom-right ticket next to the slider) ---------- */
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
        `<span class="os-offer-item">${osProductMediaMarkup(p)}${osProductName(p)}</span>`
    )
    .join('');

  osLoadImages(document.getElementById('offerItems'));

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

/* ---------- Hero slider (cycles between the slides inside #heroSlider) ---------- */
let osHeroIndex = 0;
let osHeroTimer = null;

function showHeroSlide(index) {
  const slides = document.querySelectorAll('#heroSlider .os-hero-slide');
  if (!slides.length) return;
  osHeroIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => slide.classList.toggle('os-hero-slide-active', i === osHeroIndex));
  document.querySelectorAll('#heroDots .os-hero-dot').forEach((dot, i) => dot.classList.toggle('active', i === osHeroIndex));
}

function initHeroSlider() {
  const slides = document.querySelectorAll('#heroSlider .os-hero-slide');
  const dotsWrap = document.getElementById('heroDots');
  if (!slides.length || !dotsWrap) return;

  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'os-hero-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => { showHeroSlide(i); restartHeroAutoplay(); });
    dotsWrap.appendChild(dot);
  });

  document.getElementById('heroPrev')?.addEventListener('click', () => { showHeroSlide(osHeroIndex - 1); restartHeroAutoplay(); });
  document.getElementById('heroNext')?.addEventListener('click', () => { showHeroSlide(osHeroIndex + 1); restartHeroAutoplay(); });

  restartHeroAutoplay();
}

function restartHeroAutoplay() {
  if (osHeroTimer) clearInterval(osHeroTimer);
  osHeroTimer = setInterval(() => showHeroSlide(osHeroIndex + 1), 7000);
}

const brandMedia = document.getElementById('brandMedia');
brandMedia.innerHTML = osImageMarkup('assets/img/hero/slide-2-image.jpg', osT('hero_slide2_title'), 'bi-basket3-fill', false);
osLoadImages(brandMedia);

renderFeatured();
renderOffer();
renderProductGrid();
initHeroSlider();
