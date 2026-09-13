/* Organic Special — translations & language helpers */

const OS_DICT = {
  en: {
    app_name: "Organic Special",
    splash_tagline: "HEALTHY · ORGANIC · NATURAL",
    choose_language: "Choose your language",
    lang_en_native: "English",
    lang_en_sub: "Continue in English",
    lang_ar_native: "العربية",
    lang_ar_sub: "Continue in Arabic",

    nav_home: "Products",
    nav_cart: "Cart",
    search_placeholder: "Search products…",
    all_categories: "All",

    add_to_cart: "Add to cart",
    quantity: "Quantity",
    each: "each",
    view_details: "View details",
    close: "Close",
    added_to_cart: "Added to cart",

    cart_title: "Your cart",
    cart_empty_title: "Your cart is empty",
    cart_empty_sub: "Browse our products and add something healthy.",
    continue_shopping: "Continue shopping",
    remove: "Remove",
    order_summary: "Order summary",
    items_count: "Items",
    subtotal: "Subtotal",
    proceed_checkout: "Proceed to checkout",
    back_to_cart: "Back to cart",

    checkout_title: "Delivery details",
    full_name: "Full name",
    full_name_placeholder: "e.g. Ahmed Mohamed",
    city: "City",
    select_city: "Select your city",
    country: "Country",
    mobile_whatsapp: "Mobile number (WhatsApp)",
    mobile_whatsapp_hint: "We'll send your order confirmation on WhatsApp, so please make sure this number has WhatsApp.",
    mobile_additional: "Additional number",
    mobile_additional_sub: "(optional)",
    place_order: "Confirm order",
    field_required: "This field is required.",
    invalid_mobile: "Enter a valid Egyptian mobile number.",
    order_error_generic: "Something went wrong while placing your order. Please try again.",

    order_success_title: "Order received",
    order_success_sub: "Thanks! We'll contact you on WhatsApp shortly to confirm your order.",
    order_success_id: "Order number",
    back_to_home: "Back to products",

    admin_login_title: "Admin login",
    admin_login_sub: "Sign in to view incoming orders.",
    phone_number: "Phone number",
    password: "Password",
    login_btn: "Sign in",
    login_error: "Incorrect phone number or password.",
    server_unreachable: "Could not reach the server. Please try again.",
    logout: "Log out",

    dashboard_title: "Orders",
    filter_city: "City",
    filter_country: "Country",
    filter_status: "Status",
    all_cities: "All cities",
    all_statuses: "All statuses",
    date_from: "From",
    date_to: "To",
    clear_filters: "Clear",
    export_excel: "Export to Excel",
    search_by_id: "Search by order ID",
    total_orders: "Total orders",
    pending_orders: "Pending",
    confirmed_orders: "Confirmed",
    shipped_orders: "Shipped",
    delivered_orders: "Delivered",
    returned_orders: "Returned",
    order_id_col: "Order #",
    customer_col: "Customer",
    city_col: "City",
    mobile_col: "Mobile",
    total_col: "Total",
    status_col: "Status",
    date_col: "Date",
    view: "View",
    order_details_title: "Order details",
    items_ordered: "Items ordered",
    no_orders_found: "No orders match your filters.",
    loading: "Loading…",
    status_pending: "Pending",
    status_confirmed: "Confirmed",
    status_shipped: "Shipped",
    status_delivered: "Delivered",
    status_returned: "Returned",
    status_update_error: "Could not update the order status. Please try again.",
    nothing_to_export: "There's nothing to export for the current filters.",
    egypt: "Egypt",
    currency: "EGP",
  },

  ar: {
    app_name: "أورجانيك سبيشال",
    splash_tagline: "صحي · عضوي · طبيعي",
    choose_language: "اختر لغتك",
    lang_en_native: "English",
    lang_en_sub: "المتابعة بالإنجليزية",
    lang_ar_native: "العربية",
    lang_ar_sub: "المتابعة بالعربية",

    nav_home: "المنتجات",
    nav_cart: "السلة",
    search_placeholder: "ابحث عن منتج…",
    all_categories: "الكل",

    add_to_cart: "أضف إلى السلة",
    quantity: "الكمية",
    each: "للقطعة",
    view_details: "عرض التفاصيل",
    close: "إغلاق",
    added_to_cart: "تمت الإضافة إلى السلة",

    cart_title: "سلتك",
    cart_empty_title: "سلتك فارغة",
    cart_empty_sub: "تصفح منتجاتنا وأضف شيئًا صحيًا.",
    continue_shopping: "متابعة التسوق",
    remove: "إزالة",
    order_summary: "ملخص الطلب",
    items_count: "عدد المنتجات",
    subtotal: "الإجمالي",
    proceed_checkout: "إتمام الطلب",
    back_to_cart: "العودة للسلة",

    checkout_title: "بيانات التوصيل",
    full_name: "الاسم بالكامل",
    full_name_placeholder: "مثال: أحمد محمد",
    city: "المدينة",
    select_city: "اختر مدينتك",
    country: "الدولة",
    mobile_whatsapp: "رقم الموبايل (واتساب)",
    mobile_whatsapp_hint: "سنرسل تأكيد الطلب عبر واتساب، لذا تأكد أن هذا الرقم يعمل بواتساب.",
    mobile_additional: "رقم إضافي",
    mobile_additional_sub: "(اختياري)",
    place_order: "تأكيد الطلب",
    field_required: "هذا الحقل مطلوب.",
    invalid_mobile: "أدخل رقم موبايل مصري صحيح.",
    order_error_generic: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.",

    order_success_title: "تم استلام طلبك",
    order_success_sub: "شكرًا لك! سنتواصل معك عبر واتساب قريبًا لتأكيد الطلب.",
    order_success_id: "رقم الطلب",
    back_to_home: "العودة للمنتجات",

    admin_login_title: "دخول المسؤول",
    admin_login_sub: "سجل الدخول لعرض الطلبات الواردة.",
    phone_number: "رقم الموبايل",
    password: "كلمة المرور",
    login_btn: "تسجيل الدخول",
    login_error: "رقم الموبايل أو كلمة المرور غير صحيحة.",
    server_unreachable: "تعذر الوصول إلى الخادم. حاول مرة أخرى.",
    logout: "تسجيل الخروج",

    dashboard_title: "الطلبات",
    filter_city: "المدينة",
    filter_country: "الدولة",
    filter_status: "الحالة",
    all_cities: "كل المدن",
    all_statuses: "كل الحالات",
    date_from: "من",
    date_to: "إلى",
    clear_filters: "مسح",
    export_excel: "تصدير إلى إكسل",
    search_by_id: "ابحث برقم الطلب",
    total_orders: "إجمالي الطلبات",
    pending_orders: "قيد الانتظار",
    confirmed_orders: "مؤكدة",
    shipped_orders: "تم الشحن",
    delivered_orders: "تم التوصيل",
    returned_orders: "مرتجعة",
    order_id_col: "رقم الطلب",
    customer_col: "العميل",
    city_col: "المدينة",
    mobile_col: "الموبايل",
    total_col: "الإجمالي",
    status_col: "الحالة",
    date_col: "التاريخ",
    view: "عرض",
    order_details_title: "تفاصيل الطلب",
    items_ordered: "المنتجات المطلوبة",
    no_orders_found: "لا توجد طلبات مطابقة.",
    loading: "جارٍ التحميل…",
    status_pending: "قيد الانتظار",
    status_confirmed: "مؤكد",
    status_shipped: "تم الشحن",
    status_delivered: "تم التوصيل",
    status_returned: "مرتجع",
    status_update_error: "تعذر تحديث حالة الطلب. حاول مرة أخرى.",
    nothing_to_export: "لا توجد بيانات لتصديرها في ظل الفلاتر الحالية.",
    egypt: "مصر",
    currency: "جنيه",
  },
};

function osLang() {
  return localStorage.getItem('os_lang') || 'en';
}

function osSetLang(lang) {
  localStorage.setItem('os_lang', lang);
}

function osT(key) {
  const lang = osLang();
  return (OS_DICT[lang] && OS_DICT[lang][key]) || OS_DICT.en[key] || key;
}

/* Applies translations to any element carrying data-i18n / data-i18n-placeholder */
function osApplyI18n(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = osT(el.getAttribute('data-i18n'));
  });
  scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', osT(el.getAttribute('data-i18n-placeholder')));
  });
}

/* If someone lands on an inner page directly without picking a language yet,
   send them to the splash/language screen first. */
function osRequireLang() {
  if (!localStorage.getItem('os_lang')) {
    window.location.href = 'index.html';
  }
}

function osFormatPrice(amount) {
  const n = Number(amount).toFixed(2).replace(/\.00$/, '');
  return `${n} ${osT('currency')}`;
}

document.addEventListener('DOMContentLoaded', () => osApplyI18n());
