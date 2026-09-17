/* Organic Special — static product catalog.
   Prices are in EGP. Local photos are optional; icons remain as fallbacks.
   Optional details: ingredients_en / ingredients_ar (text), and images
   (extra photo paths, shown after image in the product detail slider). */

const OS_CATEGORIES = [
  { id: 'seeds', en: 'Seeds', ar: 'بذور' },
  { id: 'tea', en: 'Tea', ar: 'شاي' },
  { id: 'grains', en: 'Grains', ar: 'حبوب' },
];

const OS_PRODUCTS = [
  {
    id: 1,
    image: 'assets/img/products/1.jpg',
    category: 'seeds',
    icon: 'bi-flower1',
    name_en: 'Chia Seeds', name_ar: 'بذور الشيا',
    unit_en: '250g pack', unit_ar: 'عبوة 250 جم',
    price: 150,
    desc_en: 'Small black seeds packed with fiber and omega-3. Soak them in water or milk for a few minutes and add to breakfast bowls or smoothies.',
    desc_ar: 'بذور سوداء صغيرة غنية بالألياف وأوميجا 3. انقعها في الماء أو اللبن لبضع دقائق وأضفها إلى الإفطار أو العصائر.',
  },
  {
    id: 2,
    image: 'assets/img/products/2.jpg',
    category: 'seeds',
    icon: 'bi-flower2',
    name_en: 'Flax Seeds', name_ar: 'بذور الكتان',
    unit_en: '250g pack', unit_ar: 'عبوة 250 جم',
    price: 90,
    desc_en: 'A pantry staple for a healthy digestive system. Grind before use to get the most benefit, and sprinkle over salads or oatmeal.',
    desc_ar: 'أساسي صحي للجهاز الهضمي. يُفضل طحنها قبل الاستخدام والاستفادة الكاملة منها، ورشها على السلطة أو الشوفان.',
  },
  {
    id: 3,
    image: 'assets/img/products/3.jpg',
    category: 'seeds',
    icon: 'bi-flower3',
    name_en: 'Black Seeds (Nigella)', name_ar: 'حبة البركة',
    unit_en: '200g pack', unit_ar: 'عبوة 200 جم',
    price: 110,
    desc_en: 'Known as "the seed of blessing", used across the region for generations. A pinch goes well in bread dough, tea, or honey.',
    desc_ar: 'تُعرف بحبة البركة، ومُستخدمة منذ أجيال في المنطقة. رشة منها تُضاف إلى عجين الخبز أو الشاي أو العسل.',
  },
  {
    id: 4,
    image: 'assets/img/products/4.jpg',
    category: 'seeds',
    icon: 'bi-basket2-fill',
    name_en: 'Pumpkin Seeds', name_ar: 'بذور اليقطين',
    unit_en: '250g pack', unit_ar: 'عبوة 250 جم',
    price: 130,
    desc_en: 'Lightly roasted, unsalted pumpkin seeds. A satisfying snack on their own, or a crunchy topping for soups and salads.',
    desc_ar: 'بذور يقطين محمصة قليلاً وغير مملحة. مقرمشات شهية بمفردها، أو إضافة مقرمشة على الشوربة والسلطة.',
  },
  {
    id: 5,
    image: 'assets/img/products/5.jpg',
    category: 'seeds',
    icon: 'bi-sun-fill',
    name_en: 'Sunflower Seeds', name_ar: 'بذور دوار الشمس',
    unit_en: '250g pack', unit_ar: 'عبوة 250 جم',
    price: 70,
    desc_en: 'Raw, shelled sunflower seeds with a mild nutty taste. Great mixed into granola or bread dough.',
    desc_ar: 'بذور دوار الشمس مقشرة وطبيعية بطعم جوزي خفيف. رائعة عند خلطها بالجرانولا أو عجين الخبز.',
  },
  {
    id: 6,
    image: 'assets/img/products/6.jpg',
    category: 'seeds',
    icon: 'bi-droplet-fill',
    name_en: 'Sesame Seeds', name_ar: 'بذور السمسم',
    unit_en: '250g pack', unit_ar: 'عبوة 250 جم',
    price: 85,
    desc_en: 'Hulled white sesame seeds, cleaned and ready to use for tahini, baking, or topping breads and salads.',
    desc_ar: 'بذور سمسم أبيض مقشر ونظيف وجاهز للاستخدام في الطحينة أو الخبيز أو تزيين الخبز والسلطات.',
  },
  {
    id: 7,
    image: 'assets/img/products/7.jpg',
    // Existing tea/seeds photo used as a second image to try the slider.
    images: ['assets/img/hero/slide-2-image.jpg'],
    ingredients_en: 'Green tea leaves.',
    ingredients_ar: 'أوراق الشاي الأخضر.',
    category: 'tea',
    icon: 'bi-cup-hot-fill',
    name_en: 'Green Tea', name_ar: 'الشاي الأخضر',
    unit_en: '100g loose leaf', unit_ar: '100 جم أوراق فضفاضة',
    price: 120,
    desc_en: 'Whole-leaf green tea with a light, grassy flavor. Steep for 2–3 minutes in water just off the boil.',
    desc_ar: 'أوراق شاي أخضر كاملة بنكهة خفيفة عشبية. يُنقع لمدة 2-3 دقائق في ماء ساخن غير مغلي تمامًا.',
  },
  {
    id: 8,
    image: 'assets/img/products/8.jpg',
    category: 'grains',
    icon: 'bi-tree-fill',
    name_en: 'Quinoa', name_ar: 'الكينوا',
    unit_en: '500g pack', unit_ar: 'عبوة 500 جم',
    price: 180,
    desc_en: 'A complete plant protein that cooks like rice in about 15 minutes. Works in salads, bowls, or as a side dish.',
    desc_ar: 'بروتين نباتي متكامل يُطهى مثل الأرز في حوالي 15 دقيقة. مناسب للسلطات والأطباق الجانبية.',
  },
  {
    // Bundle deal shown in the homepage "offer" card. It's a normal catalog
    // entry (category 'bundle') so the existing cart/checkout code needs no
    // changes — it's just excluded from the regular grid in main.js.
    id: 101,
    images: ['assets/img/products/7.jpg', 'assets/img/products/1.jpg'],
    ingredients_en: 'Green tea leaves and chia seeds (separately packed).',
    ingredients_ar: 'أوراق الشاي الأخضر وبذور الشيا (معبأة بشكل منفصل).',
    category: 'bundle',
    icon: 'bi-gift-fill',
    name_en: 'Green Tea + Chia Seeds Bundle', name_ar: 'حزمة الشاي الأخضر وبذور الشيا',
    unit_en: '100g tea + 250g chia', unit_ar: '100 جم شاي + 250 جم شيا',
    price: 230,
    desc_en: 'Two of our most-loved staples together: a light, grassy green tea and a fiber-rich seed for your morning bowl. Bundled at a special price — 40 EGP less than buying them apart.',
    desc_ar: 'اثنان من أكثر منتجاتنا محبة معًا: شاي أخضر بنكهة عشبية خفيفة، وبذور غنية بالألياف لطبق إفطارك. بسعر عرض خاص أقل بـ 40 جنيهًا من شرائهما منفصلين.',
  },
];

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
