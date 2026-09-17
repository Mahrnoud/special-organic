/* Site content editor. All output is escaped; writes use the admin session. */
let osContentDraft = null;
let osContentRevision = null;
let osContentDirty = false;
let osContentBusy = false;
const contentEditor = document.getElementById('contentEditor');
const contentForm = document.getElementById('contentForm');
const contentStatus = document.getElementById('contentSaveStatus');
function contentLabel(en, ar) { return osLang() === 'ar' ? ar : en; }
function contentGet(path) { return path.split('.').reduce((obj, key) => obj[key], osContentDraft); }
function contentSet(path, value) {
  const keys = path.split('.');
  const key = keys.pop();
  keys.reduce((obj, name) => obj[name], osContentDraft)[key] = value;
}
function contentDirty() { osContentDirty = true; contentStatus.textContent = osT('content_unsaved'); }
function contentField(path, label, options = {}) {
  const { multiline = false, required = false, type = 'text', direction = '', limit = 2000, hidden = false, disabled = false } = options;
  const id = 'content_' + path.replaceAll('.', '_');
  const attrs = `id="${id}" class="form-control" data-content-path="${path}" ${direction ? `dir="${direction}"` : ''} ${required ? 'required' : ''} ${disabled ? 'disabled' : ''} maxlength="${limit}"`;
  return `<div class="col-md-6" ${hidden ? 'hidden' : ''}><label for="${id}" class="form-label">${osEscape(label)}</label>${multiline ? `<textarea ${attrs} rows="3">${osEscape(contentGet(path))}</textarea>` : `<input ${attrs} type="${type}" value="${osEscape(contentGet(path))}">`}</div>`;
}
function contentBilingual(path, label, required = false) {
  return ['en', 'ar'].map(lang => contentField(path + '.' + lang, label + (lang === 'en' ? ' (English)' : ' (العربية)'), {
    direction: lang === 'ar' ? 'rtl' : 'ltr', multiline: /description|desc|hours|address/.test(path), required, limit: 5000,
  })).join('');
}
function contentImage(path) {
  const id = 'upload_' + path.replaceAll('.', '_');
  return contentField(path, osT('content_image'), { direction: 'ltr' }) + `<div class="col-md-6"><label class="form-label" for="${id}">${osT('content_upload')}</label><input id="${id}" type="file" class="form-control" accept="image/jpeg,image/png,image/webp,image/gif" data-upload-path="${path}"></div><div class="col-12"><img class="content-image-preview" data-preview-path="${path}" src="${osEscape(contentGet(path))}" alt="${osEscape(osT('content_image'))}" ${contentGet(path) ? '' : 'hidden'}></div>`;
}
function contentSection(title, inner) {
  return `<section class="content-editor-section"><h2 class="h5 mb-3">${osEscape(title)}</h2>${inner}</section>`;
}
function renderContentEditor() {
  const slides = osContentDraft.slides.map((slide, index) => {
    const path = `slides.${index}`;
    const products = osAdminProducts.map(p => `<option value="${p.id}" ${slide.product_id === p.id ? 'selected' : ''}>${osEscape(osLang() === 'ar' ? p.name_ar : p.name_en)}${p.archived ? ' (' + osT('archived_products') + ')' : ''}</option>`).join('');
    return `<div class="content-slide"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><h3 class="h6 mb-0">${osT('content_slide')} ${index + 1}</h3><div class="d-flex flex-wrap gap-2">
      <button type="button" class="btn btn-sm btn-outline-forest" data-slide-up="${index}" ${index === 0 ? 'disabled' : ''}>${osT('move_up')}</button>
      <button type="button" class="btn btn-sm btn-outline-forest" data-slide-down="${index}" ${index === osContentDraft.slides.length - 1 ? 'disabled' : ''}>${osT('move_down')}</button>
      <button type="button" class="btn btn-sm btn-outline-danger" data-slide-remove="${index}" ${osContentDraft.slides.length === 1 ? 'disabled' : ''}>${osT('remove_slide')}</button></div></div>
      <div class="row g-3">${contentImage(path + '.image')}${['tag', 'title', 'description', 'button'].map(key => contentBilingual(path + '.' + key, osT('content_' + key), ['title', 'button'].includes(key))).join('')}
      <div class="col-md-6"><label class="form-label" for="action_${index}">${osT('content_action')}</label><select id="action_${index}" class="form-select" data-slide-action="${index}"><option value="link" ${!slide.product_id ? 'selected' : ''}>${osT('content_follow_link')}</option><option value="cart" ${slide.product_id ? 'selected' : ''}>${osT('content_cart_action')}</option></select></div>
      <div class="col-md-6" ${slide.product_id ? '' : 'hidden'} data-product-choice="${index}"><label class="form-label" for="product_${index}">${osT('content_product')}</label><select id="product_${index}" class="form-select" data-content-path="${path}.product_id" ${slide.product_id ? 'required' : 'disabled'}><option value="">${osT('content_choose_product')}</option>${products}</select></div>
      ${contentField(path + '.href', osT('content_link'), { required: !slide.product_id, direction: 'ltr', hidden: !!slide.product_id, disabled: !!slide.product_id })}</div></div>`;
  }).join('');
  let html = contentSection(osT('content_slides'), `<p class="text-muted-soft">${osT('content_link_help')}</p>${slides}<button type="button" class="btn btn-outline-forest" id="addContentSlide" ${osContentDraft.slides.length >= 10 ? 'disabled' : ''}>${osT('add_slide')}</button>`);
  const aboutKeys = Object.keys(osContentDraft.texts).filter(key => key.startsWith('about_'));
  const label = key => ({ about_badge: osT('content_tag'), about_title: osT('content_title'), about_desc: osT('content_description'), contact_title: osT('content_title'), contact_desc: osT('content_description'), contact_whatsapp_btn: osT('content_button'), footer_about_desc: contentLabel('Footer description', 'وصف الفوتر'), discover_badge: osT('content_tag'), discover_title: osT('content_title'), discover_desc: osT('content_description'), learn_more: osT('content_button') }[key] || contentLabel('Card', 'بطاقة') + ' ' + key.match(/\d/)[0] + ' — ' + osT(key.endsWith('title') ? 'content_title' : 'content_description'));
  html += contentSection(osT('content_about'), `<div class="row g-3">${aboutKeys.map(key => contentBilingual('texts.' + key, label(key))).join('')}</div>`);
  html += contentSection(osT('content_contact'), `<p class="text-muted-soft">${osT('content_social_help')}</p><div class="row g-3">${['contact_title', 'contact_desc', 'contact_whatsapp_btn'].map(key => contentBilingual('texts.' + key, label(key))).join('')}
    ${contentField('contact.phone', osT('content_phone'), { type: 'tel', direction: 'ltr' })}${contentField('contact.email', osT('contact_email_label'), { type: 'email', direction: 'ltr' })}
    ${['facebook', 'instagram', 'whatsapp'].map(key => contentField('contact.' + key, key[0].toUpperCase() + key.slice(1) + ' URL', { type: 'url', direction: 'ltr' })).join('')}
    ${contentBilingual('contact.address', osT('contact_address_label'))}${contentBilingual('contact.hours', osT('contact_hours_label'))}<div class="col-12"><h3 class="h6 mt-3">${osT('content_contact_image')}</h3></div>${contentImage('contact.image')}</div>`);
  html += contentSection(osT('content_discover'), `<div class="row g-3">${['discover_badge', 'discover_title', 'discover_desc', 'learn_more', 'footer_about_desc'].map(key => contentBilingual('texts.' + key, label(key))).join('')}</div>`);
  contentEditor.innerHTML = html;
}
function contentBusy(busy) {
  osContentBusy = busy;
  document.getElementById('contentFields').disabled = busy || !osContentDraft;
}
async function loadContent() {
  if (osContentBusy) return;
  contentBusy(true);
  document.getElementById('contentStatus').textContent = osT('loading');
  document.getElementById('retryContent').hidden = true;
  try {
    const [data, catalog] = await Promise.all([
      osAdminRequest('api/get_content.php', { cache: 'no-store' }),
      osAdminRequest('api/get_products.php?admin=1', { cache: 'no-store' }),
    ]);
    osAdminProducts = catalog.products;
    osContentDraft = data.content;
    osContentRevision = data.revision;
    renderContentEditor();
    document.getElementById('contentStatus').textContent = '';
  } catch (error) {
    document.getElementById('contentStatus').textContent = error.message || osT('request_error');
    document.getElementById('retryContent').hidden = false;
  } finally { contentBusy(false); }
}
document.getElementById('retryContent').addEventListener('click', loadContent);
contentEditor.addEventListener('input', event => {
  const path = event.target.dataset.contentPath;
  if (!path) return;
  contentSet(path, path.endsWith('product_id') ? Number(event.target.value) : event.target.value);
  contentDirty();
  if (path.endsWith('.image')) {
    const preview = contentEditor.querySelector(`[data-preview-path="${path}"]`);
    preview.hidden = !event.target.value;
    if (event.target.value) preview.src = event.target.value;
  }
});
contentEditor.addEventListener('change', async event => {
  const input = event.target;
  if (input.dataset.slideAction !== undefined) {
    const index = Number(input.dataset.slideAction), cart = input.value === 'cart';
    const choice = contentEditor.querySelector(`[data-product-choice="${index}"]`);
    const select = choice.querySelector('select');
    choice.hidden = !cart; select.disabled = !cart; select.required = cart;
    const product = cart ? osAdminProducts.find(p => !p.archived) : null;
    select.value = product ? String(product.id) : '';
    osContentDraft.slides[index].product_id = product?.id || 0;
    const link = contentEditor.querySelector(`[data-content-path="slides.${index}.href"]`);
    link.closest('.col-md-6').hidden = cart; link.disabled = cart; link.required = !cart;
    if (cart && !link.value.trim()) { link.value = '#productsSection'; osContentDraft.slides[index].href = '#productsSection'; }
    contentDirty();
  }
  if (!input.dataset.uploadPath || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { osAdminNotice(osT('content_upload'), true); input.value = ''; return; }
  contentBusy(true);
  contentStatus.textContent = osT('saving');
  try {
    const body = new FormData(); body.append('photo', file);
    const data = await osAdminRequest('api/upload_content_image.php', { method: 'POST', body });
    contentSet(input.dataset.uploadPath, data.image);
    renderContentEditor(); contentDirty();
  } catch (error) { osAdminNotice(error.message || osT('request_error'), true); contentStatus.textContent = error.message; }
  finally { contentBusy(false); }
});
contentEditor.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || osContentBusy) return;
  const slides = osContentDraft.slides;
  if (button.id === 'addContentSlide' && slides.length < 10) slides.push({ image: '', tag: { en: '', ar: '' }, title: { en: '', ar: '' }, description: { en: '', ar: '' }, button: { en: 'Shop now', ar: 'تسوق الآن' }, href: '#productsSection', product_id: 0 });
  else if (button.dataset.slideRemove !== undefined && slides.length > 1) slides.splice(Number(button.dataset.slideRemove), 1);
  else if (button.dataset.slideUp !== undefined || button.dataset.slideDown !== undefined) {
    const index = Number(button.dataset.slideUp ?? button.dataset.slideDown);
    const next = index + (button.dataset.slideUp !== undefined ? -1 : 1);
    [slides[index], slides[next]] = [slides[next], slides[index]];
  } else return;
  renderContentEditor(); contentDirty();
});
contentForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (osContentBusy || !contentForm.reportValidity()) return;
  contentBusy(true); contentStatus.textContent = osT('saving');
  try {
    const data = await osAdminRequest('api/save_content.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: osContentDraft, revision: osContentRevision }) });
    osContentDraft = data.content; osContentRevision = data.revision; osContentDirty = false;
    contentStatus.textContent = osT('content_saved');
  } catch (error) { contentStatus.textContent = error.message || osT('request_error'); }
  finally { contentBusy(false); }
});
window.addEventListener('beforeunload', event => {
  if (osContentDirty || osContentBusy) { event.preventDefault(); event.returnValue = ''; }
});

document.getElementById('contentTab').addEventListener('click', () => {
  if (osContentDraft && !osContentBusy) renderContentEditor();
});
