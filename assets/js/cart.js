/* Organic Special — cart state, stored in the browser (localStorage).
   The cart itself never needs the server; only the final confirmed
   order is sent to the backend. */

const OS_CART_KEY = 'os_cart';

function osGetCart() {
  try {
    return JSON.parse(localStorage.getItem(OS_CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function osSaveCart(cart) {
  localStorage.setItem(OS_CART_KEY, JSON.stringify(cart));
  osUpdateCartBadge();
}

function osAddToCart(productId, qty) {
  const cart = osGetCart();
  const line = cart.find((l) => l.id === productId);
  if (line) {
    line.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  osSaveCart(cart);
}

function osUpdateCartQty(productId, qty) {
  let cart = osGetCart();
  if (qty <= 0) {
    cart = cart.filter((l) => l.id !== productId);
  } else {
    const line = cart.find((l) => l.id === productId);
    if (line) line.qty = qty;
  }
  osSaveCart(cart);
}

function osRemoveFromCart(productId) {
  const cart = osGetCart().filter((l) => l.id !== productId);
  osSaveCart(cart);
}

function osClearCart() {
  localStorage.removeItem(OS_CART_KEY);
  osUpdateCartBadge();
}

function osCartLinesWithDetails() {
  return osGetCart()
    .map((line) => {
      const product = OS_PRODUCTS.find((p) => p.id === line.id);
      if (!product) return null;
      return { ...line, product, lineTotal: product.price * line.qty };
    })
    .filter(Boolean);
}

function osCartCount() {
  return osGetCart().reduce((sum, l) => sum + l.qty, 0);
}

function osCartTotal() {
  return osCartLinesWithDetails().reduce((sum, l) => sum + l.lineTotal, 0);
}

function osUpdateCartBadge() {
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    const count = osCartCount();
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', osUpdateCartBadge);
