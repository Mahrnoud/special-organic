/* Organic Special — homepage logic */

osRequireLang();

let osActiveCategory = 'all';
let osSelectedProduct = null;
let osModalQty = 1;

function renderCategoryChips() {
  const wrap = document.getElementById('categoryChips');
  const chips = [{ id: 'all', label: osT('all_categories') }].concat(
    OS_CATEGORIES.map((c) => ({ id: c.id, label: osCategoryName(c.id) }))
  );
  wrap.innerHTML = chips
    .map(
      (c) => `<button type="button" class="category-chip ${c.id === osActiveCategory ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>`
    )
    .join('');
  wrap.querySelectorAll('.category-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      osActiveCategory = btn.getAttribute('data-cat');
      renderCategoryChips();
      renderProductGrid();
    });
  });
}

function renderProductGrid() {
  const grid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');
  const term = (document.getElementById('searchInput').value || '').trim().toLowerCase();

  const filtered = OS_PRODUCTS.filter((p) => {
    const matchesCategory = osActiveCategory === 'all' || p.category === osActiveCategory;
    const name = osProductName(p).toLowerCase();
    const matchesSearch = !term || name.includes(term);
    return matchesCategory && matchesSearch;
  });

  grid.innerHTML = filtered
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

  noResults.classList.toggle('d-none', filtered.length > 0);

  grid.querySelectorAll('.product-card').forEach((card) => {
    const open = () => openProductModal(Number(card.getAttribute('data-id')));
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

function openProductModal(productId) {
  osSelectedProduct = OS_PRODUCTS.find((p) => p.id === productId);
  if (!osSelectedProduct) return;
  osModalQty = 1;

  document.getElementById('modalIcon').className = `bi ${osSelectedProduct.icon}`;
  document.getElementById('modalCategory').textContent = osCategoryName(osSelectedProduct.category);
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

document.getElementById('searchInput').addEventListener('input', renderProductGrid);

document.querySelectorAll('[data-lang]').forEach((el) => {
  el.addEventListener('click', () => {
    osSetLang(el.getAttribute('data-lang'));
    window.location.reload();
  });
});

renderCategoryChips();
renderProductGrid();
