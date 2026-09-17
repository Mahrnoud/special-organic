/* Shared public content, loaded once on every storefront page. */
let OS_SITE_CONTENT = null;
function osContentText(value) { return value?.[osLang()] || value?.en || ''; }
const osContentReady = fetch('api/get_content.php', { cache: 'no-store' })
  .then(async response => {
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error('Content unavailable');
    OS_SITE_CONTENT = data.content;
    for (const [key, value] of Object.entries(data.content.texts)) {
      OS_DICT.en[key] = value.en;
      OS_DICT.ar[key] = value.ar;
    }
    osApplyI18n();
    return true;
  }).catch(() => false);
