/* Cart lines are identified by product + size, and survive page refreshes. */
const OS_CART_KEY = 'os_cart';
function osGetCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(OS_CART_KEY));
    return Array.isArray(cart) ? cart.filter(line => line && Number.isInteger(line.id) && Number.isInteger(line.qty) && line.qty > 0) : [];
  } catch (e) { return []; }
}
function osSaveCart(cart) { localStorage.setItem(OS_CART_KEY, JSON.stringify(cart)); osUpdateCartBadge(); }
function osAddToCart(productId, qty, sizeId) {
  const product = osCatalogLoaded && OS_PRODUCTS.find(p => p.id === productId);
  if (!product) return false;
  const variant = sizeId == null && product.variants.length === 1 ? product.variants[0] : product.variants.find(v => v.size_id === sizeId);
  if (!variant || !Number.isInteger(qty) || qty < 1) return false;
  const cart = osGetCart();
  const line = cart.find(l => l.id === productId && l.size_id === variant.size_id);
  if (line) line.qty = Math.min(999, line.qty + qty);
  else cart.push({ id: productId, size_id: variant.size_id, qty: Math.min(999, qty) });
  osSaveCart(cart);
  return true;
}
function osUpdateCartQty(productId, qty, sizeId) {
  if (qty <= 0) return osRemoveFromCart(productId, sizeId);
  const cart = osGetCart();
  const line = cart.find(l => l.id === productId && l.size_id === sizeId);
  if (line) line.qty = Math.min(999, qty);
  osSaveCart(cart);
}
function osRemoveFromCart(productId, sizeId) { osSaveCart(osGetCart().filter(l => l.id !== productId || l.size_id !== sizeId)); }
function osClearCart() { localStorage.removeItem(OS_CART_KEY); osUpdateCartBadge(); }
function osCartLinesWithDetails() {
  return osGetCart().map(line => {
    const product = OS_PRODUCTS.find(p => p.id === line.id);
    const variant = product?.variants.find(v => v.size_id === line.size_id);
    return variant ? { ...line, product, variant, lineTotal: variant.price * line.qty } : null;
  }).filter(Boolean);
}
function osCartCount() { return osGetCart().reduce((sum, l) => sum + l.qty, 0); }
function osCartTotal() { return osCartLinesWithDetails().reduce((sum, l) => sum + l.lineTotal, 0); }
function osUpdateCartBadge() {
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    const count = osCartCount(); el.textContent = count; el.style.display = count > 0 ? 'flex' : 'none';
  });
}
/* Resolve old product-only carts only when the size is unambiguous. */
function osReconcileCart() {
  if (!osCatalogLoaded) return;
  const result = [];
  let removed = false;
  for (const line of osGetCart()) {
    const product = OS_PRODUCTS.find(p => p.id === line.id);
    const sizeId = line.size_id ?? (product?.variants.length === 1 ? product.variants[0].size_id : null);
    if (!product?.variants.some(v => v.size_id === sizeId)) { removed = true; continue; }
    const existing = result.find(l => l.id === line.id && l.size_id === sizeId);
    if (existing) existing.qty = Math.min(999, existing.qty + line.qty);
    else result.push({ id: line.id, size_id: sizeId, qty: Math.min(999, line.qty) });
  }
  osSaveCart(result);
  if (removed) {
    const notice = document.createElement('div');
    notice.className = 'alert alert-warning'; notice.setAttribute('role', 'status');
    notice.textContent = osT('cart_size_removed');
    (document.querySelector('main') || document.body).prepend(notice);
  }
}
document.addEventListener('DOMContentLoaded', osUpdateCartBadge);
