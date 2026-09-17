/* Organic Special — shared catalog loaded from the store database. */

const OS_CATEGORIES = [
  { id: 'seeds', en: 'Seeds', ar: 'بذور' },
  { id: 'tea', en: 'Tea', ar: 'شاي' },
  { id: 'grains', en: 'Grains', ar: 'حبوب' },
];

const OS_PRODUCTS = [];
let osCatalogLoaded = false;
const osCatalogReady = fetch('api/get_products.php', { cache: 'no-store' })
  .then(async (response) => {
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error('Catalog unavailable');
    OS_PRODUCTS.splice(0, OS_PRODUCTS.length, ...data.products);
    osCatalogLoaded = true;
    return true;
  })
  .catch(() => false);

/* Change this id to feature another product. Its photo, name, price,
   description, and fallback icon come from the catalog entry above. */
const OS_FEATURED_PRODUCT_ID = 3;

/* The two products that make up the homepage bundle offer, plus the id of
   the combined product above that actually gets added to the cart. The
   "regular price" shown crossed out is calculated from these automatically,
   so it always matches OS_PRODUCTS if a price changes. */
const OS_BUNDLE_ITEM_IDS = [7, 1];
const OS_BUNDLE_PRODUCT_ID = 101;

function osCategoryName(catId) {
  const c = OS_CATEGORIES.find((x) => x.id === catId);
  if (!c) return catId;
  return osLang() === 'ar' ? c.ar : c.en;
}

function osProductName(p) { return osLang() === 'ar' ? p.name_ar : p.name_en; }
function osProductUnit(p) { return osLang() === 'ar' ? p.unit_ar : p.unit_en; }
function osProductDesc(p) { return osLang() === 'ar' ? p.desc_ar : p.desc_en; }

function osProductIngredients(p) {
  return (osLang() === 'ar' ? p.ingredients_ar || p.ingredients_en : p.ingredients_en || p.ingredients_ar) || '';
}

function osProductImages(p) {
  return [...new Set([p.image, ...(Array.isArray(p.images) ? p.images : [])]
    .filter((src) => typeof src === 'string' && src.trim()))];
}

/* Shared image markup. Bind handlers before assigning src so even cached
   failures keep the icon visible, without showing a broken-image symbol. */
function osImageAttribute(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function osImageMarkup(src, alt, icon, lazy = true) {
  return `<span class="os-photo">
    <i class="bi ${osImageAttribute(icon)}" aria-hidden="true"></i>
    ${src ? `<img data-photo-src="${osImageAttribute(src)}" alt="${osImageAttribute(alt)}" loading="${lazy ? 'lazy' : 'eager'}" decoding="async">` : ''}
  </span>`;
}

function osProductMediaMarkup(product, lazy = true) {
  if (product.id === OS_BUNDLE_PRODUCT_ID) {
    return `<span class="os-product-pair">${OS_BUNDLE_ITEM_IDS
      .map((id) => OS_PRODUCTS.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => osImageMarkup(p.image, osProductName(p), p.icon, lazy))
      .join('')}</span>`;
  }
  return osImageMarkup(osProductImages(product)[0], osProductName(product), product.icon, lazy);
}

function osLoadImages(root) {
  root.querySelectorAll('img[data-photo-src]').forEach((img) => {
    img.addEventListener('load', () => img.parentElement.classList.add('is-loaded'));
    img.addEventListener('error', () => img.parentElement.classList.remove('is-loaded'));
    img.src = img.dataset.photoSrc;
    img.removeAttribute('data-photo-src');
  });
}
