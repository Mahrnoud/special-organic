/* Product management shares the admin session and request helpers in admin.js. */
let osAdminProducts = [];
let osEditingProduct = null;
let osProductsRequest = 0;
let osProductSaving = false;
let osProductEditorRequest = 0;
const osProductCategories = [
  ['seeds', 'category_seeds'], ['tea', 'category_tea'],
  ['grains', 'category_grains'], ['bundle', 'category_bundle'],
];

for (const section of ['orders', 'products', 'sizes', 'shipping', 'content']) {
  document.getElementById(section + 'Tab').addEventListener('click', () => {
    for (const name of ['orders', 'products', 'sizes', 'shipping', 'content']) {
      const active = name === section;
      document.getElementById(name + 'Panel').hidden = !active;
      const button = document.getElementById(name + 'Tab');
      button.className = active ? 'btn btn-forest' : 'btn btn-outline-forest';
      button.setAttribute('aria-pressed', String(active));
    }
    document.getElementById('adminNotice').classList.add('d-none');
  });
}

async function loadProducts() {
  const request = ++osProductsRequest;
  const status = document.getElementById('productListStatus');
  status.textContent = osT('loading');
  document.getElementById('productsTableBody').innerHTML = '';
  try {
    const data = await osAdminRequest('api/get_products.php?admin=1', { cache: 'no-store' });
    if (request !== osProductsRequest) return;
    osAdminProducts = data.products;
    renderAdminProducts();
  } catch (error) {
    if (request === osProductsRequest) {
      osAdminProducts = [];
      status.textContent = error.message || osT('request_error');
    }
  }
}

function renderAdminProducts() {
  const search = document.getElementById('productSearch').value.trim().toLocaleLowerCase();
  const state = document.getElementById('productStateFilter').value;
  const products = osAdminProducts.filter((p) =>
    (state === 'all' || p.archived === (state === 'archived')) &&
    `${p.id} ${p.name_en} ${p.name_ar}`.toLocaleLowerCase().includes(search));
  document.getElementById('productListStatus').textContent = products.length
    ? osT('products_count').replace('{count}', products.length) : osT('no_products_found');
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = products.map((p) => {
    const name = osLang() === 'ar' ? p.name_ar : p.name_en;
    const unit = (p.variants || []).map(v => `${osLang() === 'ar' ? v.label_ar : v.label_en}: ${osFormatPrice(v.price)}`).join(' · ');
    const category = osProductCategories.find(([id]) => id === p.category);
    return `<tr>
      <td><div class="d-flex align-items-center gap-3"><div class="admin-product-photo">${p.image ? `<img src="${osEscape(p.image)}" alt="" loading="lazy">` : '<i class="bi bi-basket3" aria-hidden="true"></i>'}</div><div class="admin-product-name"><strong>${osEscape(name)}</strong><div class="small text-muted-soft">#${p.id} · ${osEscape(unit)}</div></div></div></td>
      <td>${osEscape(category ? osT(category[1]) : p.category)}</td><td>${p.variants.length > 1 ? osT('from_price') + ' ' : ''}${osFormatPrice(p.price)}</td>
      <td><span class="badge ${p.archived ? 'text-bg-secondary' : 'text-bg-success'}">${osT(p.archived ? 'archived' : 'active')}</span></td>
      <td><div class="d-flex gap-2"><button class="btn btn-sm btn-outline-forest edit-product" data-id="${p.id}" aria-label="${osEscape(osT('edit_product') + ': ' + name)}">${osT('edit')}</button><button class="btn btn-sm ${p.archived ? 'btn-forest' : 'btn-outline-secondary'} archive-product" data-id="${p.id}" aria-label="${osEscape(osT(p.archived ? 'restore_product' : 'archive_product') + ': ' + name)}">${osT(p.archived ? 'restore_product' : 'archive_product')}</button></div></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('.edit-product').forEach((button) => {
    button.addEventListener('click', () => openProductEditor(osAdminProducts.find((p) => p.id === Number(button.dataset.id))));
  });
  tbody.querySelectorAll('.archive-product').forEach((button) => {
    button.addEventListener('click', async () => {
      const product = osAdminProducts.find((p) => p.id === Number(button.dataset.id));
      button.disabled = true;
      try {
        await osAdminRequest('api/archive_product.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: product.id, archived: !product.archived }),
        });
        osAdminNotice(osT(product.archived ? 'product_restored' : 'product_archived'));
        await loadProducts();
      } catch (error) { osAdminNotice(error.message || osT('request_error'), true); }
      finally { button.disabled = false; }
    });
  });
  tbody.querySelectorAll('.admin-product-photo img').forEach((img) => {
    img.addEventListener('error', () => { img.parentElement.innerHTML = '<i class="bi bi-basket3" aria-hidden="true"></i>'; });
  });
}

async function openProductEditor(product = null) {
  const request = ++osProductEditorRequest;
  osEditingProduct = product;
  const form = document.getElementById('productEditorForm');
  form.reset();
  document.getElementById('productEditorError').classList.add('d-none');
  document.getElementById('productEditorTitle').textContent = osT(product ? 'edit_product' : 'add_product');
  document.getElementById('product_category').innerHTML = osProductCategories.map(([id, key]) => `<option value="${id}">${osT(key)}</option>`).join('');
  for (const field of form.querySelectorAll('[name]')) field.value = product?.[field.name] ?? (field.name === 'category' ? 'seeds' : '');
  document.getElementById('product_images').value = (product?.images || []).join('\n');
  document.getElementById('productVariantRows').innerHTML = '';
  document.getElementById('productEditorFields').disabled = true;
  document.getElementById('saveProductBtn').disabled = true;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('productEditorModal')).show();
  try {
    const data = await osAdminRequest('api/get_sizes.php', { cache: 'no-store' });
    if (request !== osProductEditorRequest) return;
    osAdminSizes = data.sizes;
    for (const variant of product?.variants || [{}]) addProductVariantRow(variant);
    document.getElementById('productEditorFields').disabled = false;
    document.getElementById('saveProductBtn').disabled = false;
  } catch (error) {
    if (request !== osProductEditorRequest) return;
    const box = document.getElementById('productEditorError');
    box.textContent = osT('size_load_error');
    box.classList.remove('d-none');
  }
}

function addProductVariantRow(variant = {}) {
  const row = document.createElement('div');
  row.className = 'row g-2 align-items-end mb-2 product-variant-row';
  const assigned = new Set((osEditingProduct?.variants || []).map(v => v.size_id));
  const choices = osAdminSizes.filter(size => !size.archived || assigned.has(size.id));
  row.innerHTML = `<div class="col-6"><label class="form-label w-100">${osT('size_label')}<select class="form-select variant-size mt-1" required><option value="">${osT('choose_size')}</option>${choices.map(size => `<option value="${size.id}" ${variant.size_id === size.id ? 'selected' : ''}>${osEscape(osLang() === 'ar' ? size.label_ar : size.label_en)}${size.archived ? ' (' + osT('archived') + ')' : ''}</option>`).join('')}</select></label></div>
    <div class="col-4"><label class="form-label w-100">${osT('price_label')}<input type="number" class="form-control variant-price mt-1" min="0" max="1000000" step="0.01" required value="${variant.price ?? ''}"></label></div>
    <div class="col-2 pb-2"><button type="button" class="btn btn-sm btn-outline-danger remove-variant">${osT('remove')}</button></div>`;
  row.querySelector('.remove-variant').onclick = () => {
    if (document.querySelectorAll('.product-variant-row').length > 1) row.remove();
    validateVariantChoices();
  };
  row.querySelector('select').onchange = validateVariantChoices;
  document.getElementById('productVariantRows').append(row);
  validateVariantChoices();
}
function validateVariantChoices() {
  const selects = [...document.querySelectorAll('.variant-size')];
  for (const select of selects) select.setCustomValidity(select.value && selects.some(other => other !== select && other.value === select.value) ? osT('duplicate_size') : '');
  document.querySelectorAll('.remove-variant').forEach(button => { button.disabled = selects.length === 1; });
}
document.getElementById('addVariantRow').onclick = () => addProductVariantRow();

document.getElementById('productEditorModal').addEventListener('shown.bs.modal', () => document.getElementById('product_name_en').focus());
document.getElementById('productEditorModal').addEventListener('hide.bs.modal', (event) => { if (osProductSaving) event.preventDefault(); else osProductEditorRequest++; });
document.getElementById('addProductBtn').addEventListener('click', () => openProductEditor());
document.getElementById('refreshProducts').addEventListener('click', loadProducts);
document.getElementById('productSearch').addEventListener('input', renderAdminProducts);
document.getElementById('productStateFilter').addEventListener('change', renderAdminProducts);
document.getElementById('productEditorForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (osProductSaving) return;
  const form = event.currentTarget;
  const errorBox = document.getElementById('productEditorError');
  errorBox.classList.add('d-none');
  const product = Object.fromEntries(new FormData(form));
  product.id = osEditingProduct?.id ?? null;
  product.variants = [...document.querySelectorAll('.product-variant-row')].map(row => ({ size_id: Number(row.querySelector('.variant-size').value), price: Number(row.querySelector('.variant-price').value) }));
  product.icon = osEditingProduct?.icon || 'bi-basket3-fill';
  product.images = document.getElementById('product_images').value.split('\n').map((s) => s.trim()).filter(Boolean);
  const data = new FormData();
  data.append('product', JSON.stringify(product));
  const photo = document.getElementById('product_photo').files[0];
  if (photo) data.append('photo', photo);
  osProductSaving = true;
  document.getElementById('productEditorFields').disabled = true;
  const save = document.getElementById('saveProductBtn');
  save.disabled = true;
  save.textContent = osT('saving');
  try {
    await osAdminRequest('api/save_product.php', { method: 'POST', body: data });
    osProductSaving = false;
    bootstrap.Modal.getInstance(document.getElementById('productEditorModal')).hide();
    document.getElementById('productStateFilter').value = osEditingProduct?.archived ? 'archived' : 'active';
    document.getElementById('productSearch').value = '';
    osAdminNotice(osT('product_saved'));
    await loadProducts();
  } catch (error) {
    errorBox.textContent = error.message || osT('request_error');
    errorBox.classList.remove('d-none');
    errorBox.scrollIntoView({ block: 'nearest' });
  } finally {
    osProductSaving = false;
    document.getElementById('productEditorFields').disabled = false;
    save.disabled = false;
    save.textContent = osT('save_product');
  }
});
